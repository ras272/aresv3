#!/bin/bash

# Script de deployment para ARES WhatsApp Bot
# Autor: Sistema ARES
# Fecha: $(date)

set -e  # Salir si hay errores

echo "🚀 Iniciando deployment de ARES WhatsApp Bot..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logs
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecutar desde el directorio del bot."
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado. Instalar Node.js 18+ primero."
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js versión 18+ requerida. Versión actual: $(node -v)"
fi

log "✅ Node.js $(node -v) detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm no está instalado."
fi

log "✅ npm $(npm -v) detectado"

# Crear directorios necesarios
log "📁 Creando directorios..."
mkdir -p logs
mkdir -p whatsapp-session
success "Directorios creados"

# Verificar archivo .env
if [ ! -f ".env" ]; then
    warning "Archivo .env no encontrado"
    if [ -f ".env.example" ]; then
        log "📋 Copiando .env.example a .env"
        cp .env.example .env
        warning "⚠️  IMPORTANTE: Editar .env con tus configuraciones antes de continuar"
        echo ""
        echo "Variables requeridas:"
        echo "- SUPABASE_URL"
        echo "- SUPABASE_ANON_KEY" 
        echo "- JAVIER_PHONE"
        echo "- JEFA_PHONE"
        echo ""
        read -p "¿Has configurado el archivo .env? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Configurar .env antes de continuar"
        fi
    else
        error "No se encontró .env.example para copiar"
    fi
fi

log "✅ Archivo .env encontrado"

# Instalar dependencias
log "📦 Instalando dependencias..."
npm install
success "Dependencias instaladas"

# Compilar TypeScript
log "🔨 Compilando TypeScript..."
npm run build
success "Compilación completada"

# Verificar compilación
if [ ! -f "dist/index.js" ]; then
    error "La compilación falló - no se encontró dist/index.js"
fi

log "✅ Archivos compilados correctamente"

# Crear script de inicio para producción
log "📝 Creando script de inicio..."
cat > start.sh << 'EOF'
#!/bin/bash

# Script de inicio para ARES WhatsApp Bot
# Usar: ./start.sh [start|stop|restart|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="bot.pid"
LOG_FILE="logs/bot.log"

start_bot() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Bot ya está ejecutándose (PID: $PID)"
            return 1
        else
            rm -f "$PID_FILE"
        fi
    fi
    
    echo "Iniciando ARES WhatsApp Bot..."
    nohup node dist/index.js > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "Bot iniciado (PID: $(cat $PID_FILE))"
    echo "Logs: tail -f $LOG_FILE"
}

stop_bot() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Deteniendo bot (PID: $PID)..."
            kill $PID
            rm -f "$PID_FILE"
            echo "Bot detenido"
        else
            echo "Bot no está ejecutándose"
            rm -f "$PID_FILE"
        fi
    else
        echo "Bot no está ejecutándose"
    fi
}

status_bot() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Bot ejecutándose (PID: $PID)"
            echo "Uptime: $(ps -o etime= -p $PID)"
        else
            echo "Bot no está ejecutándose (PID file obsoleto)"
            rm -f "$PID_FILE"
        fi
    else
        echo "Bot no está ejecutándose"
    fi
}

case "$1" in
    start)
        start_bot
        ;;
    stop)
        stop_bot
        ;;
    restart)
        stop_bot
        sleep 2
        start_bot
        ;;
    status)
        status_bot
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF

chmod +x start.sh
success "Script de inicio creado: ./start.sh"

# Crear script de monitoreo
log "📊 Creando script de monitoreo..."
cat > monitor.sh << 'EOF'
#!/bin/bash

# Script de monitoreo para ARES WhatsApp Bot

echo "=== ARES WhatsApp Bot - Monitor ==="
echo "Fecha: $(date)"
echo ""

# Estado del proceso
echo "🤖 Estado del Bot:"
./start.sh status
echo ""

# Logs recientes
echo "📋 Últimos logs (10 líneas):"
if [ -f "logs/combined.log" ]; then
    tail -10 logs/combined.log
else
    echo "No hay logs disponibles"
fi
echo ""

# Errores recientes
echo "❌ Errores recientes:"
if [ -f "logs/error.log" ]; then
    ERROR_COUNT=$(wc -l < logs/error.log 2>/dev/null || echo "0")
    echo "Total de errores: $ERROR_COUNT"
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "Últimos 5 errores:"
        tail -5 logs/error.log
    fi
else
    echo "No hay errores registrados"
fi
echo ""

# Uso de disco
echo "💾 Uso de disco (logs):"
du -sh logs/ 2>/dev/null || echo "Directorio logs no encontrado"
echo ""

# Memoria del proceso
echo "🧠 Uso de memoria:"
if [ -f "bot.pid" ]; then
    PID=$(cat bot.pid)
    if ps -p $PID > /dev/null 2>&1; then
        ps -o pid,ppid,cmd,%mem,%cpu -p $PID
    else
        echo "Proceso no encontrado"
    fi
else
    echo "Bot no está ejecutándose"
fi
EOF

chmod +x monitor.sh
success "Script de monitoreo creado: ./monitor.sh"

# Verificar configuración final
log "🔍 Verificando configuración..."

# Verificar variables de entorno críticas
source .env
MISSING_VARS=()

[ -z "$SUPABASE_URL" ] && MISSING_VARS+=("SUPABASE_URL")
[ -z "$SUPABASE_ANON_KEY" ] && MISSING_VARS+=("SUPABASE_ANON_KEY")
[ -z "$JAVIER_PHONE" ] && MISSING_VARS+=("JAVIER_PHONE")
[ -z "$JEFA_PHONE" ] && MISSING_VARS+=("JEFA_PHONE")

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    error "Variables de entorno faltantes: ${MISSING_VARS[*]}"
fi

success "Configuración verificada"

# Resumen final
echo ""
echo "🎉 ¡Deployment completado exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Iniciar el bot: ./start.sh start"
echo "2. Escanear código QR de WhatsApp"
echo "3. Verificar logs: tail -f logs/combined.log"
echo "4. Monitorear: ./monitor.sh"
echo ""
echo "🔧 Comandos útiles:"
echo "- Iniciar: ./start.sh start"
echo "- Detener: ./start.sh stop"
echo "- Reiniciar: ./start.sh restart"
echo "- Estado: ./start.sh status"
echo "- Monitor: ./monitor.sh"
echo "- Logs: tail -f logs/combined.log"
echo ""
echo "📞 El bot estará listo cuando aparezca 'WhatsApp client is ready' en los logs"
echo ""
success "¡ARES WhatsApp Bot listo para usar! 🚀"