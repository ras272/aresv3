# Script de deployment para ARES WhatsApp Bot (Windows)
# Autor: Sistema ARES
# Fecha: $(Get-Date)

param(
    [switch]$SkipConfirmation
)

# Configuración de colores
$Host.UI.RawUI.ForegroundColor = "White"

function Write-Log {
    param($Message, $Color = "Cyan")
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

Write-Log "🚀 Iniciando deployment de ARES WhatsApp Bot..." "Blue"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Error "No se encontró package.json. Ejecutar desde el directorio del bot."
}

# Verificar Node.js
try {
    $nodeVersion = node --version
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Error "Node.js versión 18+ requerida. Versión actual: $nodeVersion"
    }
    Write-Log "✅ Node.js $nodeVersion detectado"
} catch {
    Write-Error "Node.js no está instalado. Instalar Node.js 18+ primero."
}

# Verificar npm
try {
    $npmVersion = npm --version
    Write-Log "✅ npm $npmVersion detectado"
} catch {
    Write-Error "npm no está instalado."
}

# Crear directorios necesarios
Write-Log "📁 Creando directorios..."
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "whatsapp-session" | Out-Null
Write-Success "Directorios creados"

# Verificar archivo .env
if (-not (Test-Path ".env")) {
    Write-Warning "Archivo .env no encontrado"
    if (Test-Path ".env.example") {
        Write-Log "📋 Copiando .env.example a .env"
        Copy-Item ".env.example" ".env"
        Write-Warning "⚠️  IMPORTANTE: Editar .env con tus configuraciones antes de continuar"
        Write-Host ""
        Write-Host "Variables requeridas:"
        Write-Host "- SUPABASE_URL"
        Write-Host "- SUPABASE_ANON_KEY" 
        Write-Host "- JAVIER_PHONE"
        Write-Host "- JEFA_PHONE"
        Write-Host ""
        
        if (-not $SkipConfirmation) {
            $response = Read-Host "¿Has configurado el archivo .env? (y/N)"
            if ($response -notmatch '^[Yy]$') {
                Write-Error "Configurar .env antes de continuar"
            }
        }
    } else {
        Write-Error "No se encontró .env.example para copiar"
    }
}

Write-Log "✅ Archivo .env encontrado"

# Instalar dependencias
Write-Log "📦 Instalando dependencias..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error instalando dependencias"
}
Write-Success "Dependencias instaladas"

# Compilar TypeScript
Write-Log "🔨 Compilando TypeScript..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error en la compilación"
}
Write-Success "Compilación completada"

# Verificar compilación
if (-not (Test-Path "dist/index.js")) {
    Write-Error "La compilación falló - no se encontró dist/index.js"
}

Write-Log "✅ Archivos compilados correctamente"

# Crear script de inicio para Windows
Write-Log "📝 Creando scripts de inicio..."

# Script de inicio (start.ps1)
@'
# Script de inicio para ARES WhatsApp Bot (Windows)
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action
)

$PidFile = "bot.pid"
$LogFile = "logs\bot.log"

function Start-Bot {
    if (Test-Path $PidFile) {
        $pid = Get-Content $PidFile
        if (Get-Process -Id $pid -ErrorAction SilentlyContinue) {
            Write-Host "Bot ya está ejecutándose (PID: $pid)"
            return
        } else {
            Remove-Item $PidFile -Force
        }
    }
    
    Write-Host "Iniciando ARES WhatsApp Bot..."
    $process = Start-Process -FilePath "node" -ArgumentList "dist/index.js" -NoNewWindow -PassThru -RedirectStandardOutput $LogFile -RedirectStandardError $LogFile
    $process.Id | Out-File $PidFile
    Write-Host "Bot iniciado (PID: $($process.Id))"
    Write-Host "Logs: Get-Content $LogFile -Wait"
}

function Stop-Bot {
    if (Test-Path $PidFile) {
        $pid = Get-Content $PidFile
        if (Get-Process -Id $pid -ErrorAction SilentlyContinue) {
            Write-Host "Deteniendo bot (PID: $pid)..."
            Stop-Process -Id $pid -Force
            Remove-Item $PidFile -Force
            Write-Host "Bot detenido"
        } else {
            Write-Host "Bot no está ejecutándose"
            Remove-Item $PidFile -Force
        }
    } else {
        Write-Host "Bot no está ejecutándose"
    }
}

function Get-BotStatus {
    if (Test-Path $PidFile) {
        $pid = Get-Content $PidFile
        if (Get-Process -Id $pid -ErrorAction SilentlyContinue) {
            $process = Get-Process -Id $pid
            Write-Host "Bot ejecutándose (PID: $pid)"
            Write-Host "Tiempo de ejecución: $((Get-Date) - $process.StartTime)"
        } else {
            Write-Host "Bot no está ejecutándose (PID file obsoleto)"
            Remove-Item $PidFile -Force
        }
    } else {
        Write-Host "Bot no está ejecutándose"
    }
}

switch ($Action) {
    "start" { Start-Bot }
    "stop" { Stop-Bot }
    "restart" { 
        Stop-Bot
        Start-Sleep -Seconds 2
        Start-Bot
    }
    "status" { Get-BotStatus }
}
'@ | Out-File -FilePath "start.ps1" -Encoding UTF8

# Script de monitoreo (monitor.ps1)
@'
# Script de monitoreo para ARES WhatsApp Bot (Windows)

Write-Host "=== ARES WhatsApp Bot - Monitor ===" -ForegroundColor Cyan
Write-Host "Fecha: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Estado del proceso
Write-Host "🤖 Estado del Bot:" -ForegroundColor Yellow
& .\start.ps1 status
Write-Host ""

# Logs recientes
Write-Host "📋 Últimos logs (10 líneas):" -ForegroundColor Yellow
if (Test-Path "logs\combined.log") {
    Get-Content "logs\combined.log" -Tail 10
} else {
    Write-Host "No hay logs disponibles" -ForegroundColor Gray
}
Write-Host ""

# Errores recientes
Write-Host "❌ Errores recientes:" -ForegroundColor Red
if (Test-Path "logs\error.log") {
    $errorCount = (Get-Content "logs\error.log" | Measure-Object -Line).Lines
    Write-Host "Total de errores: $errorCount"
    if ($errorCount -gt 0) {
        Write-Host "Últimos 5 errores:"
        Get-Content "logs\error.log" -Tail 5
    }
} else {
    Write-Host "No hay errores registrados" -ForegroundColor Green
}
Write-Host ""

# Uso de disco
Write-Host "💾 Uso de disco (logs):" -ForegroundColor Yellow
if (Test-Path "logs") {
    $size = (Get-ChildItem "logs" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Tamaño total: $([math]::Round($size, 2)) MB"
} else {
    Write-Host "Directorio logs no encontrado"
}
Write-Host ""

# Memoria del proceso
Write-Host "🧠 Uso de memoria:" -ForegroundColor Yellow
if (Test-Path "bot.pid") {
    $pid = Get-Content "bot.pid"
    if (Get-Process -Id $pid -ErrorAction SilentlyContinue) {
        Get-Process -Id $pid | Select-Object Id, ProcessName, CPU, WorkingSet
    } else {
        Write-Host "Proceso no encontrado"
    }
} else {
    Write-Host "Bot no está ejecutándose"
}
'@ | Out-File -FilePath "monitor.ps1" -Encoding UTF8

Write-Success "Scripts de inicio creados: start.ps1 y monitor.ps1"

# Verificar configuración final
Write-Log "🔍 Verificando configuración..."

# Leer variables de entorno
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $missingVars = @()
    
    $requiredVars = @("SUPABASE_URL", "SUPABASE_ANON_KEY", "JAVIER_PHONE", "JEFA_PHONE")
    
    foreach ($var in $requiredVars) {
        $found = $envContent | Where-Object { $_ -match "^$var=" -and $_ -notmatch "^$var=$" }
        if (-not $found) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Variables de entorno faltantes: $($missingVars -join ', ')"
    }
}

Write-Success "Configuración verificada"

# Resumen final
Write-Host ""
Write-Host "🎉 ¡Deployment completado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Iniciar el bot: .\start.ps1 start"
Write-Host "2. Escanear código QR de WhatsApp"
Write-Host "3. Verificar logs: Get-Content logs\combined.log -Wait"
Write-Host "4. Monitorear: .\monitor.ps1"
Write-Host ""
Write-Host "🔧 Comandos útiles:" -ForegroundColor Cyan
Write-Host "- Iniciar: .\start.ps1 start"
Write-Host "- Detener: .\start.ps1 stop"
Write-Host "- Reiniciar: .\start.ps1 restart"
Write-Host "- Estado: .\start.ps1 status"
Write-Host "- Monitor: .\monitor.ps1"
Write-Host "- Logs: Get-Content logs\combined.log -Wait"
Write-Host ""
Write-Host "📞 El bot estará listo cuando aparezca 'WhatsApp client is ready' en los logs" -ForegroundColor Yellow
Write-Host ""
Write-Success "¡ARES WhatsApp Bot listo para usar! 🚀"