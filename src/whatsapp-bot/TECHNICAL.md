# 🔧 Documentación Técnica - ARES WhatsApp Bot

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │   Bot Controller │    │   Database      │
│   Service       │◄──►│                  │◄──►│   Service       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Message       │    │   Task           │    │   Supabase      │
│   Processor     │    │   Scheduler      │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Flujo de Datos

1. **Recepción de Mensajes**
   ```
   WhatsApp → WhatsAppService → BotController → MessageProcessor
   ```

2. **Creación de Tickets**
   ```
   MessageProcessor → DatabaseService → Supabase → Notificaciones
   ```

3. **Tareas Programadas**
   ```
   TaskScheduler → BotController → DatabaseService → WhatsAppService
   ```

## 📁 Estructura de Archivos

```
src/
├── config/
│   └── index.ts              # Configuración centralizada
├── services/
│   ├── whatsappService.ts    # Manejo de WhatsApp Web
│   ├── messageProcessor.ts   # Procesamiento de mensajes
│   └── database.ts           # Conexión a Supabase
├── bot/
│   └── botController.ts      # Lógica principal del bot
├── scheduler/
│   └── taskScheduler.ts      # Tareas programadas
├── utils/
│   └── logger.ts             # Sistema de logging
└── index.ts                  # Punto de entrada
```

## 🔄 Ciclo de Vida del Bot

### 1. Inicialización
```typescript
// 1. Cargar configuración
config.load() 

// 2. Inicializar servicios
whatsappService.initialize()
databaseService.connect()

// 3. Configurar eventos
whatsappService.onMessage(handler)

// 4. Iniciar tareas programadas
taskScheduler.start()
```

### 2. Procesamiento de Mensajes
```typescript
// 1. Recibir mensaje
onMessage(message) 

// 2. Validar origen (grupo ServTec)
if (!isFromServtecGroup(message)) return

// 3. Procesar contenido
messageInfo = MessageProcessor.process(message.body)

// 4. Crear ticket si es necesario
if (messageInfo.isServiceRequest) {
  ticket = DatabaseService.createTicket(messageInfo)
  sendNotifications(ticket)
}
```

### 3. Tareas Programadas
```typescript
// Seguimiento cada 4 horas
cron.schedule('0 9,13,17,21 * * *', followUp)

// Reporte diario a las 18:00
cron.schedule('0 18 * * *', dailyReport)

// Heartbeat cada hora
cron.schedule('0 * * * *', heartbeat)
```

## 🔍 Detección de Problemas

### Palabras Clave
```typescript
PROBLEM_KEYWORDS = [
  'problema', 'falla', 'error', 'no funciona', 
  'roto', 'dañado', 'urgente', 'ayuda', 
  'emergencia', 'crítico', 'parado'
]
```

### Extracción de Clientes
```typescript
CLIENT_PATTERNS = [
  /clínica\s+([a-záéíóúñ\s]+)/i,
  /cliente\s+([a-záéíóúñ\s]+)/i,
  /hospital\s+([a-záéíóúñ\s]+)/i,
  /dr\.?\s+([a-záéíóúñ\s]+)/i
]
```

### Determinación de Prioridad
```typescript
// Crítica: urgente, crítico, emergencia, parado
// Alta: importante, pronto, rápido, necesito
// Media: mensajes largos o múltiples problemas
// Baja: resto de casos
```

## 🗄️ Integración con Base de Datos

### Tabla Principal: `mantenimientos`
```sql
CREATE TABLE mantenimientos (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER,
  tipo VARCHAR(50) DEFAULT 'Correctivo',
  descripcion TEXT NOT NULL,
  prioridad VARCHAR(20) NOT NULL,
  estado VARCHAR(20) DEFAULT 'Pendiente',
  tecnico_asignado VARCHAR(100) DEFAULT 'Javier Lopez',
  fecha DATE DEFAULT CURRENT_DATE,
  comentarios TEXT,
  es_programado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Operaciones Principales
```typescript
// Crear ticket
DatabaseService.createTicketFromWhatsApp(data)

// Obtener tickets pendientes
DatabaseService.getTicketsWithoutUpdate(hours)

// Actualizar estado
DatabaseService.updateTicketStatus(id, estado)

// Estadísticas diarias
DatabaseService.getDailyStats()
```

## 📊 Sistema de Logging

### Niveles de Log
- **error**: Errores críticos que requieren atención
- **warn**: Advertencias que no afectan funcionamiento
- **info**: Información general de operaciones
- **debug**: Información detallada para desarrollo

### Estructura de Logs
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Ticket created successfully",
  "context": {
    "ticketId": "TKT-20250115-001",
    "cliente": "Clínica San Roque",
    "prioridad": "Alta"
  },
  "service": "ares-whatsapp-bot"
}
```

## 🔒 Seguridad y Validaciones

### Validación de Entrada
```typescript
// Sanitizar números de teléfono
phone = phone.replace(/[^\d]/g, '') + '@c.us'

// Validar longitud de mensajes
if (message.length > 1000) {
  message = message.substring(0, 1000) + '...'
}

// Escapar caracteres especiales en logs
logger.info('Message processed', { 
  phone: phone.substring(0, 8) + '***' 
})
```

### Variables de Entorno Requeridas
```typescript
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JAVIER_PHONE',
  'JEFA_PHONE'
]
```

## 🚨 Manejo de Errores

### Estrategias de Recuperación
```typescript
// Reconexión automática de WhatsApp
client.on('disconnected', () => {
  logger.warn('Client disconnected, will reconnect')
  setTimeout(() => client.initialize(), 5000)
})

// Reintentos en base de datos
async function withRetry(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(1000 * (i + 1))
    }
  }
}
```

### Graceful Shutdown
```typescript
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully')
  taskScheduler.stop()
  await whatsappService.destroy()
  process.exit(0)
})
```

## 📈 Monitoreo y Métricas

### Métricas Clave
- Mensajes procesados por hora
- Tickets creados automáticamente
- Tiempo de respuesta promedio
- Errores por tipo
- Uptime del sistema

### Health Checks
```typescript
// Verificar conexión a WhatsApp
whatsappService.isClientReady()

// Verificar conexión a base de datos
await supabase.from('mantenimientos').select('count').limit(1)

// Verificar tareas programadas
taskScheduler.getStatus()
```

## 🔧 Configuración Avanzada

### Puppeteer (WhatsApp Web)
```typescript
puppeteer: {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ]
}
```

### Timezone
```typescript
// Todas las tareas usan timezone de Paraguay
timezone: 'America/Asuncion'
```

## 🚀 Optimizaciones de Performance

### Rate Limiting
```typescript
// Esperar entre mensajes para evitar spam
await new Promise(resolve => setTimeout(resolve, 2000))
```

### Batch Processing
```typescript
// Procesar múltiples tickets en lotes
const batchSize = 10
for (let i = 0; i < tickets.length; i += batchSize) {
  const batch = tickets.slice(i, i + batchSize)
  await processBatch(batch)
}
```

### Memory Management
```typescript
// Rotación automática de logs
maxsize: 5242880, // 5MB
maxFiles: 5
```

## 🔄 Actualizaciones y Mantenimiento

### Deployment
```bash
# 1. Detener bot
./start.sh stop

# 2. Actualizar código
git pull origin main

# 3. Reinstalar dependencias
npm install

# 4. Recompilar
npm run build

# 5. Reiniciar
./start.sh start
```

### Backup de Sesión
```bash
# Respaldar sesión de WhatsApp
tar -czf whatsapp-session-backup.tar.gz whatsapp-session/

# Restaurar sesión
tar -xzf whatsapp-session-backup.tar.gz
```

---

## 📞 Troubleshooting Técnico

### Problemas Comunes

1. **Bot no se conecta a WhatsApp**
   - Verificar que WhatsApp Web funciona en navegador
   - Eliminar `whatsapp-session/` y reconectar
   - Verificar args de Puppeteer

2. **No detecta mensajes del grupo**
   - Verificar `WHATSAPP_GROUP_NAME` exacto
   - Confirmar que bot está en el grupo
   - Revisar logs de conexión

3. **Tickets no se crean**
   - Verificar conexión a Supabase
   - Confirmar permisos de tabla `mantenimientos`
   - Revisar logs de base de datos

4. **Tareas programadas no funcionan**
   - Verificar timezone del servidor
   - Confirmar que TaskScheduler está iniciado
   - Revisar logs de cron

### Comandos de Diagnóstico
```bash
# Ver logs en tiempo real
tail -f logs/combined.log

# Verificar proceso
ps aux | grep "ares-whatsapp-bot"

# Verificar conexión a base de datos
node -e "require('./dist/services/database').supabase.from('mantenimientos').select('count').then(console.log)"

# Test de configuración
node -e "console.log(require('./dist/config').config)"
```