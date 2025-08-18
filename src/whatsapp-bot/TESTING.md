# 🧪 Guía de Testing - ARES WhatsApp Bot

## 🚀 Scripts de Testing Disponibles

### **Test Principal (Recomendado)**
```bash
npm test
```
Ejecuta el menú interactivo con todas las opciones de testing.

### **Tests Específicos**

#### 1. **Test Completo Automático**
```bash
npm run test:complete
```
- ✅ Verifica detección de prioridades
- ✅ Prueba extracción de clientes y equipos  
- ✅ Valida generación de mensajes
- ✅ Confirma compatibilidad con BD

#### 2. **Test de Prioridades**
```bash
npm run test:priority
```
- 🚨 Crítica: urgente, parado, no funciona
- ⚠️ Alta: importante, pronto, necesito
- 🔧 Media: problema, falla (por defecto)
- 📝 Baja: consulta, cuando puedas

#### 3. **Test Interactivo de Mensajes**
```bash
npm run test:interactive
```
- 💬 Escribe mensajes como usuario
- 🤖 Ve respuestas del bot en tiempo real
- 📊 Analiza detección automática

#### 4. **Test de Comandos de Javier**
```bash
npm run test:javier
```
- ✅ "Listo TKT-1234" → Completar
- 🔧 "Proceso TKT-1234" → En proceso
- ⏸️ "Repuesto TKT-1234" → Pausar recordatorios
- ❌ "Problema TKT-1234 [motivo]" → Reportar
- 📊 "Estado" → Ver resumen

#### 5. **Monitor en Tiempo Real**
```bash
npm run monitor
```
- 📊 Estadísticas del sistema
- 📝 Logs en tiempo real
- 🔄 Actualización automática

## 🎯 Casos de Prueba Recomendados

### **Mensajes para Probar Detección**

#### **Críticos** 🚨
```
"URGENTE: Hydrafacial parado en Ares Paraguay"
"Emergencia - equipo roto en Hospital Central"  
"Crítico: no funciona láser de Clínica Norte"
```

#### **Alta Prioridad** ⚠️
```
"Importante: Dr. Martinez necesita ayuda pronto"
"Favor revisar equipo rápido en consultorio"
"Requiere atención - problema con HIFU"
```

#### **Media Prioridad** 🔧
```
"Problema con Hydrafacial de Ares Paraguay"
"Falla en sistema de ultrasonido"
"Revisar equipo cuando tengas tiempo"
```

#### **Baja Prioridad** 📝
```
"Consulta sobre mantenimiento cuando puedas"
"Pregunta sin apuro sobre el equipo"
"Información sobre próximo servicio"
```

### **Comandos de Javier para Probar**

```bash
# Completar tickets
"Listo TKT-1234"
"Listo TKT-5678"

# Cambiar estados
"Proceso TKT-1234"
"Repuesto TKT-5678"

# Reportar problemas
"Problema TKT-1234 falta repuesto X"
"Problema TKT-5678 cliente no está"

# Consultar estado
"Estado"
```

## 🔍 Verificaciones Importantes

### **1. Detección Correcta**
- ✅ Cliente extraído del mensaje
- ✅ Equipo identificado automáticamente
- ✅ Prioridad asignada correctamente
- ✅ Número de teléfono capturado

### **2. Creación de Tickets**
- ✅ Ticket creado en base de datos
- ✅ Equipo asociado automáticamente
- ✅ Estado inicial "Pendiente"
- ✅ Técnico asignado "Javier Lopez"

### **3. Mensajes Generados**
- ✅ Respuesta en grupo con formato limpio
- ✅ Notificación privada a Javier
- ✅ Número de ticket TKT-XXXX
- ✅ Información completa y ordenada

### **4. Comandos de Javier**
- ✅ Reconocimiento de comandos
- ✅ Actualización de estados en BD
- ✅ Respuestas de confirmación
- ✅ Notificaciones a gerencia cuando corresponde

### **5. Recordatorios Inteligentes**
- ✅ Críticos: cada 2 horas
- ✅ Normales: cada 4 horas
- ✅ Sin recordatorios si "Esperando repuestos"
- ✅ Solo en horario laboral (8-18h, Lun-Sáb)

## 🚨 Troubleshooting

### **Si los tests fallan:**

1. **Compilar primero:**
   ```bash
   npm run build
   ```

2. **Verificar configuración:**
   ```bash
   # Revisar .env
   cat .env
   
   # Verificar conexión a BD
   node -e "console.log(require('./dist/config').config)"
   ```

3. **Limpiar y reinstalar:**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

### **Si el bot no responde en WhatsApp:**

1. **Verificar que esté ejecutándose:**
   ```bash
   # Ver procesos
   ps aux | grep node
   
   # Ver logs
   tail -f logs/combined.log
   ```

2. **Verificar conexión:**
   - ✅ QR escaneado correctamente
   - ✅ Grupo encontrado en logs
   - ✅ Sin errores de autenticación

3. **Verificar configuración:**
   - ✅ Nombre del grupo exacto en .env
   - ✅ Números de teléfono correctos
   - ✅ Bot agregado al grupo

## 📊 Métricas de Testing

### **Cobertura Esperada:**
- ✅ 100% detección de prioridades
- ✅ 95%+ detección de clientes
- ✅ 90%+ detección de equipos
- ✅ 100% comandos de Javier
- ✅ 100% creación de tickets

### **Performance:**
- ⚡ Respuesta < 2 segundos
- 📱 Mensajes entregados < 5 segundos
- 🗄️ Tickets creados < 3 segundos
- 🔄 Comandos procesados < 1 segundo

## 🎯 Checklist Final

Antes de poner en producción, verificar:

- [ ] Todos los tests pasan
- [ ] Bot responde en WhatsApp real
- [ ] Tickets se crean en sistema ARES
- [ ] Comandos de Javier funcionan
- [ ] Recordatorios programados activos
- [ ] Logs sin errores críticos
- [ ] Configuración de producción lista
- [ ] Números de teléfono correctos
- [ ] Grupo de WhatsApp configurado

---

## 🚀 ¡Listo para Producción!

Una vez que todos los tests pasen y las verificaciones estén completas, el bot está listo para automatizar completamente la gestión de tickets de ServTec ARES. 🎉