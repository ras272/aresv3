# 🤖 ARES WhatsApp Bot

Bot automático para gestión de tickets de ServTec a través de WhatsApp.

## 🎯 Funcionalidades

- ✅ **Creación automática de tickets** desde mensajes del grupo
- ✅ **Detección inteligente de problemas** con clasificación por prioridad
- ✅ **Notificaciones inteligentes** a Javier Lopez
- ✅ **Comandos para Javier** (actualización de estados)
- ✅ **Sistema de recordatorios** automáticos
- ✅ **API de pruebas** para mensajes de WhatsApp

## 🚀 Instalación

### 1. Configurar entorno
```bash
# Copiar configuración
cp .env.example .env

# Editar variables de entorno
nano .env
```

### 2. Instalar y compilar

**Windows (PowerShell):**
```powershell
# Ejecutar deployment
.\scripts\deploy.ps1
```

**Linux/Mac:**
```bash
# Hacer ejecutable el script
chmod +x scripts/deploy.sh

# Ejecutar deployment
./scripts/deploy.sh
```

### 3. Primera ejecución
```bash
# Modo desarrollo (con logs en consola)
npm run dev

# Escanear código QR con WhatsApp
# El bot se conectará automáticamente
```

## ⚙️ Configuración

### Variables de Entorno Requeridas

```env
# Supabase (Base de datos ARES)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key

# WhatsApp
WHATSAPP_GROUP_NAME=ServTec ARES
JAVIER_PHONE=+595123456789
JEFA_PHONE=+595987654321

# Bot
BOT_NAME=ARES Bot
ENVIRONMENT=production
LOG_LEVEL=info
```

## 🔄 Flujo de Trabajo

### 1. **Detección de Problemas**
```
Cliente → Jefa → Grupo ServTec → Bot detecta → Crea ticket → Notifica Javier
```

### 2. **Seguimiento Automático**
```
Cada 4 horas → Verifica tickets pendientes → Envía recordatorios → Escala si necesario
```

### 3. **Reportes Diarios**
```
18:00 diario → Genera estadísticas → Envía reporte a Jefa
```

## 📱 Comandos del Bot

### En el Grupo ServTec:
- **Automático**: Detecta problemas y crea tickets
- **Seguimiento**: Recordatorios de casos pendientes

### Respuestas de Javier:
- `"Listo #123"` → Marca ticket como completado
- `"Mañana #123"` → Reprograma para mañana
- `"Problema #123"` → Escala a gerencia

## 🔧 Mantenimiento

### Logs

**Windows:**
```powershell
# Ver logs en tiempo real
Get-Content logs\combined.log -Wait

# Ver solo errores
Get-Content logs\error.log -Wait

# Ver últimas líneas
Get-Content logs\combined.log -Tail 50
```

**Linux/Mac:**
```bash
# Ver logs en tiempo real
tail -f logs/combined.log

# Ver solo errores
tail -f logs/error.log
```

### Reiniciar Bot

**Windows:**
```powershell
# Reiniciar
.\start.ps1 restart

# O manualmente
.\start.ps1 stop
.\start.ps1 start
```

**Linux/Mac:**
```bash
# Reiniciar
./start.sh restart

# O manualmente
pkill -f "node dist/index.js"
npm start
```

### Verificar Estado

**Windows:**
```powershell
# Ver estado
.\start.ps1 status

# Ver logs recientes
Get-Content logs\combined.log -Tail 20

# Monitor completo
.\monitor.ps1
```

**Linux/Mac:**
```bash
# Ver estado
./start.sh status

# Ver procesos
ps aux | grep "ares-whatsapp-bot"

# Ver logs recientes
tail -20 logs/combined.log

# Monitor completo
./monitor.sh
```

## 🚨 Troubleshooting

### Bot no se conecta
1. Verificar que WhatsApp Web funciona en navegador
2. Eliminar carpeta `whatsapp-session`
3. Ejecutar `npm run dev` y escanear QR nuevamente

### No detecta mensajes del grupo
1. Verificar `WHATSAPP_GROUP_NAME` en .env
2. Asegurar que el bot está en el grupo
3. Revisar logs: `tail -f logs/combined.log`

### Tickets no se crean
1. Verificar conexión a Supabase
2. Verificar permisos de base de datos
3. Revisar logs de error: `tail -f logs/error.log`

## 🧪 Pruebas del Sistema

### Tests Básicos
```bash
# Verificar conexión a base de datos
node test-connection.js

# Probar detección de problemas
node test-bot.js

# Verificar sistema de prioridades
node test-priority.js
```

### Tests Interactivos
```bash
# Probar bot interactivamente
node test-interactive.js

# Probar comandos de Javier
node test-javier-commands.js

# Verificar WhatsApp
node test-whatsapp-simple.js
```

## 📋 Monitoreo

El bot incluye logging completo y métricas automáticas:

- **Mensajes procesados**
- **Tickets creados**
- **Notificaciones enviadas**
- **Errores y excepciones**
- **Tiempo de actividad**

## 🔒 Seguridad

- ✅ **Autenticación local** de WhatsApp
- ✅ **Logs sin datos sensibles**
- ✅ **Validación de entrada**
- ✅ **Manejo seguro de errores**
- ✅ **Rate limiting** automático

---

## 📞 Soporte

Para problemas o dudas:
1. Revisar logs del sistema
2. Verificar configuración de .env
3. Consultar documentación de troubleshooting