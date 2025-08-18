# 🤖 ARES WhatsApp Bot - Guía de Comandos

## 🚀 Comandos Básicos

### **Iniciar el Bot**
```bash
cd src/whatsapp-bot
npm start
```

### **Modo Desarrollo (con logs en consola)**
```bash
npm run dev
```

### **Compilar Código**
```bash
npm run build
```

---

## 🧪 Comandos de Testing

### **Test Principal (Menú Interactivo)**
```bash
npm test
```
- Muestra menú con todas las opciones
- Recomendado para empezar

### **Test Completo Automático**
```bash
npm run test:complete
```
- Ejecuta todos los tests automáticamente
- Verifica que todo funcione correctamente

### **Test Interactivo de Mensajes**
```bash
npm run test:interactive
```
- Escribe mensajes como si fueras usuario
- Ve cómo responde el bot en tiempo real

### **Test de Comandos de Javier**
```bash
npm run test:javier
```
- Prueba los comandos que puede usar el técnico
- Simula respuestas por WhatsApp

### **Monitor en Tiempo Real**
```bash
npm run monitor
```
- Ve logs del bot en vivo
- Estadísticas del sistema
- Útil para debugging

---

## 📱 Cómo Funciona el Bot

### **1. Detección Automática de Problemas**

Cuando alguien escribe en el grupo ServTec:

**Mensaje:** `"URGENTE: Hydrafacial parado en Ares Paraguay"`

**El bot detecta:**
- 🚨 **Prioridad:** Crítica (por "URGENTE" y "parado")
- 🏢 **Cliente:** Ares Paraguay
- 🔧 **Equipo:** Hydrafacial
- 📱 **Teléfono:** Del remitente

**El bot responde:**
```
✅ Ticket TKT-1234 creado

🏢 Cliente: Ares Paraguay
🔧 Equipo: Hydrafacial
🚨 Prioridad: Crítica
👨‍🔧 Técnico: Javier Lopez

Javier será notificado automáticamente.
```

### **2. Notificación Privada a Javier**

Javier recibe por WhatsApp privado:
```
🚨 URGENTE - Nuevo ticket TKT-1234

🏢 Cliente: Ares Paraguay
🔧 Equipo: Hydrafacial
📱 Teléfono: +595981234567
⚠️ Prioridad: Crítica

📝 Problema: Hydrafacial parado

⚡ Requiere atención inmediata.
```

---

## 👨‍🔧 Comandos de Javier (WhatsApp Privado)

### **Marcar Ticket como Completado**
```
Listo TKT-1234
```
- ✅ Cambia estado a "Finalizado"
- 📢 Notifica al grupo que está listo
- ⏰ Para los recordatorios

### **Cambiar a "En Proceso"**
```
Proceso TKT-1234
```
- 🔧 Cambia estado a "En proceso"
- 📝 Indica que Javier está trabajando
- ⏰ Recordatorios menos frecuentes

### **Pausar por Repuestos**
```
Repuesto TKT-1234
```
- ⏸️ Cambia a "Esperando repuestos"
- ❌ **PARA todos los recordatorios**
- 🔄 Se reanudan cuando cambie el estado

### **Reportar Problema**
```
Problema TKT-1234 falta pieza X
```
- ❌ Reporta inconveniente a gerencia
- 📧 Notifica automáticamente a la jefa
- 📝 Incluye los detalles del problema

### **Ver Estado de Tickets**
```
Estado
```
- 📊 Muestra resumen de tickets pendientes
- 🚨 Indica si hay críticos
- ⏳ Cuenta pendientes, en proceso, etc.

---

## ⏰ Sistema de Recordatorios Inteligentes

### **Frecuencia Automática:**
- 🚨 **Críticos:** Cada 2 horas
- 📋 **Normales:** Cada 4 horas
- ⏸️ **Esperando repuestos:** SIN recordatorios
- ✅ **Finalizados:** SIN recordatorios

### **Horario:**
- 🕐 **Lunes a Sábado:** 8:00 - 18:00
- 🚫 **Domingos:** Sin recordatorios

### **Escalamiento:**
- 🚨 **Críticos +6h:** Notifica al grupo y gerencia
- ⚠️ **Normales +24h:** Recordatorio en grupo

---

## 🎯 Detección de Prioridades

### **🚨 Crítica**
Palabras: `urgente`, `crítico`, `emergencia`, `parado`, `no funciona`, `roto`, `grave`

**Ejemplos:**
- "URGENTE: equipo parado"
- "Emergencia en hospital"
- "Crítico: no funciona"

### **⚠️ Alta**
Palabras: `importante`, `pronto`, `rápido`, `necesito`, `favor`, `ayuda`

**Ejemplos:**
- "Importante: revisar equipo"
- "Necesito ayuda pronto"
- "Favor atender rápido"

### **🔧 Media (Por defecto)**
Palabras: `problema`, `falla`, `revisar`

**Ejemplos:**
- "Problema con Hydrafacial"
- "Falla en el sistema"
- "Revisar equipo"

### **📝 Baja**
Palabras: `consulta`, `cuando puedas`, `sin apuro`

**Ejemplos:**
- "Consulta cuando puedas"
- "Pregunta sin apuro"

---

## 🗄️ Integración con Base de Datos

### **Tickets Creados Automáticamente:**
- ✅ **Estado:** Pendiente
- 👨‍🔧 **Técnico:** Javier Lopez (auto-asignado)
- 📅 **Fecha:** Automática
- 🔧 **Tipo:** Correctivo
- 📝 **Comentarios:** Incluye origen WhatsApp + teléfono

### **Estados Válidos:**
- `Pendiente` → Envía recordatorios
- `En proceso` → Recordatorios normales
- `Esperando repuestos` → SIN recordatorios
- `Finalizado` → SIN recordatorios

---

## 🔧 Comandos de Mantenimiento

### **Ver Logs en Tiempo Real**
```bash
# Windows
Get-Content logs\combined.log -Wait

# Linux/Mac
tail -f logs/combined.log
```

### **Reiniciar Bot**
```bash
# Detener (Ctrl+C en la terminal)
# Luego iniciar de nuevo
npm start
```

### **Verificar Estado**
```bash
npm run monitor
```

### **Limpiar y Reinstalar**
```bash
rm -rf node_modules dist
npm install
npm run build
```

---

## 📞 Configuración Importante

### **Variables en .env:**
```env
# Base de datos
SUPABASE_URL=tu_url_supabase
SUPABASE_ANON_KEY=tu_clave

# WhatsApp
WHATSAPP_GROUP_NAME=ServTec ARES
JAVIER_PHONE=+595981234567
JEFA_PHONE=+595987654321

# Bot
BOT_NAME=ARES Bot
ENVIRONMENT=production
```

### **Verificar Configuración:**
- ✅ Nombre del grupo EXACTO
- ✅ Números con código de país (+595)
- ✅ Bot agregado al grupo WhatsApp
- ✅ Conexión a base de datos funcionando

---

## 🚨 Troubleshooting Rápido

### **Bot no responde:**
1. Verificar que esté ejecutándose: `npm run monitor`
2. Revisar logs: `tail -f logs/combined.log`
3. Verificar conexión WhatsApp: buscar "client is ready"

### **No crea tickets:**
1. Verificar conexión BD en logs
2. Probar con: `npm run test:complete`
3. Revisar permisos de Supabase

### **Javier no recibe notificaciones:**
1. Verificar número en .env
2. Confirmar que es mensaje privado (no grupo)
3. Revisar logs de envío

---

## 🎯 Resumen Rápido

1. **Iniciar:** `npm start`
2. **Probar:** `npm test`
3. **Monitorear:** `npm run monitor`
4. **Javier usa:** `"Listo TKT-XXXX"`, `"Estado"`, etc.
5. **Recordatorios:** Automáticos según prioridad
6. **Pausar recordatorios:** `"Repuesto TKT-XXXX"`

¡El bot automatiza completamente la gestión de tickets de ServTec! 🚀