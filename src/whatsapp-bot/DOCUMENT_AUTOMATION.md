# 📱 Sistema de Envío Automático de Documentos por WhatsApp

## 🎯 **Descripción General**

Sistema profesional para envío automático de reportes técnicos y facturas a clientes por WhatsApp cuando se finaliza un ticket de servicio.

## 🏗️ **Arquitectura del Sistema**

### **📁 Estructura de Archivos**

```
src/whatsapp-bot/
├── src/
│   ├── services/
│   │   ├── documentService.ts          # Gestión de documentos y datos
│   │   ├── whatsappDocumentService.ts  # Envío por WhatsApp
│   │   └── whatsappService.ts          # Servicio base de WhatsApp (actualizado)
│   ├── api/
│   │   └── documentSender.ts           # Controladores de API REST
│   ├── migrations/
│   │   └── 001_create_document_sendings.sql  # Tabla de registro
│   └── index.ts                        # Servidor principal (actualizado)
└── DOCUMENT_AUTOMATION.md              # Esta documentación
```

## 🔧 **Componentes Principales**

### **1. DocumentService**
- ✅ Obtiene información completa del ticket
- ✅ Busca datos de contacto del cliente
- ✅ Genera URLs de documentos (reporte + factura)
- ✅ Valida tickets para envío
- ✅ Registra logs de envío

### **2. WhatsAppDocumentService**
- ✅ Envío inteligente de documentos
- ✅ Mensajes personalizados por cliente
- ✅ Manejo de errores robusto
- ✅ Delays entre mensajes
- ✅ Validación de números de WhatsApp

### **3. DocumentSenderController**
- ✅ API REST para integración web
- ✅ Endpoints para envío y estado
- ✅ Validación de parámetros
- ✅ Respuestas estructuradas

## 📡 **API Endpoints**

### **POST /api/send-documents**
Enviar documentos de un ticket al cliente.

**Request:**
```json
{
  "ticketId": "uuid-del-ticket"
}
```

**Response (Éxito):**
```json
{
  "success": true,
  "phone": "+595981234567",
  "sentDocuments": ["Reporte Técnico", "Factura"],
  "message": "Documentos enviados exitosamente a +595981234567"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "No se encontró número de WhatsApp para el cliente"
}
```

### **GET /api/document-status/:ticketId**
Obtener estado de envío de documentos.

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": true,
    "lastSentAt": "2025-08-16T10:30:00Z",
    "phone": "+595981234567"
  }
}
```

### **POST /api/validate-whatsapp**
Validar número de WhatsApp.

**Request:**
```json
{
  "phone": "+595981234567"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true
}
```

## 🗄️ **Base de Datos**

### **Tabla: document_sendings**
```sql
CREATE TABLE document_sendings (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES mantenimientos(id),
  client_phone VARCHAR(20) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  sent_documents JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 **Flujo de Funcionamiento**

### **1. Trigger de Envío**
```
Ticket finalizado → API call → Envío automático
```

### **2. Proceso Completo**
```
1. Validar ticket (finalizado + reporte generado)
2. Obtener información del cliente y equipo
3. Buscar número de WhatsApp del cliente
4. Generar URLs de documentos (reporte + factura)
5. Enviar mensaje de introducción
6. Enviar reporte técnico (PDF)
7. Enviar factura (PDF) si existe
8. Enviar mensaje de cierre
9. Registrar envío en base de datos
```

### **3. Mensajes Enviados**

**Mensaje de Introducción:**
```
¡Hola! Soy del equipo de *ServTec ARES* ✅

Su servicio técnico ha sido completado exitosamente:

📋 *Detalles del Servicio:*
• *Cliente:* Clínica Norte
• *Equipo:* ND-Elite
• *Ubicación:* Consultorio 1
• *Fecha:* 16/08/2025
• *Técnico:* Javier Lopez
• *Reporte:* RPT-001

📎 Le enviamos la documentación completa a continuación...
```

**Documentos:**
- 📋 Reporte_Tecnico_RPT-001.pdf
- 💰 Factura_RPT-001.pdf

**Mensaje de Cierre:**
```
✅ *Documentación enviada completa*

Si tiene alguna consulta sobre el servicio realizado, no dude en contactarnos.

¡Gracias por confiar en *ServTec ARES*! 🔧

_Servicio Técnico Especializado_
_Equipos Médicos y Estéticos_
```

## 🚀 **Integración con la Aplicación Web**

### **Frontend (React/Next.js)**
```typescript
// Componente para envío de documentos
const DocumentSender = ({ ticketId }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendDocuments = async () => {
    setSending(true);
    
    try {
      const response = await fetch('/api/send-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSent(true);
        toast.success(`✅ ${result.message}`);
      } else {
        toast.error(`❌ ${result.error}`);
      }
    } catch (error) {
      toast.error('❌ Error enviando documentos');
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={handleSendDocuments}
      disabled={sending || sent}
      className="bg-green-500 text-white px-4 py-2 rounded"
    >
      {sending ? '📤 Enviando...' : sent ? '✅ Enviado' : '📱 Enviar por WhatsApp'}
    </button>
  );
};
```

## ⚙️ **Configuración**

### **Variables de Entorno**
```env
# En .env del bot
APP_URL=https://tu-app.vercel.app
PORT=3000

# En .env de la aplicación web
WHATSAPP_BOT_URL=http://localhost:3000
```

### **Dependencias Adicionales**
```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "@types/express": "^4.17.0",
  "@types/cors": "^2.8.0"
}
```

## 🧪 **Testing**

### **Test Manual**
```bash
# Enviar documentos de un ticket
curl -X POST http://localhost:3000/api/send-documents \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "uuid-del-ticket"}'

# Verificar estado
curl http://localhost:3000/api/document-status/uuid-del-ticket

# Health check
curl http://localhost:3000/health
```

## 🔒 **Seguridad y Validaciones**

### **Validaciones Implementadas**
- ✅ Ticket debe estar finalizado
- ✅ Reporte debe estar generado
- ✅ Cliente debe tener número de WhatsApp
- ✅ Documentos deben estar disponibles
- ✅ Número de WhatsApp debe ser válido

### **Manejo de Errores**
- ✅ Logs detallados de todos los procesos
- ✅ Registro de errores en base de datos
- ✅ Respuestas de error estructuradas
- ✅ Timeouts y reintentos automáticos

## 📊 **Monitoreo y Logs**

### **Métricas Disponibles**
- Envíos exitosos vs fallidos
- Tiempo promedio de envío
- Documentos más enviados
- Clientes con más envíos

### **Logs Estructurados**
```json
{
  "level": "info",
  "message": "Documents sent successfully",
  "ticketId": "uuid",
  "clientPhone": "+595981234567",
  "sentDocuments": ["Reporte Técnico", "Factura"],
  "timestamp": "2025-08-16T10:30:00Z"
}
```

## 🚀 **Deployment**

### **Desarrollo**
```bash
cd src/whatsapp-bot
npm install
npm run build
npm start
```

### **Producción**
```bash
# El bot incluye servidor Express
# Puerto por defecto: 3000
# Health check: /health
```

## 🔄 **Próximas Mejoras**

### **Funcionalidades Futuras**
- [ ] Envío programado de documentos
- [ ] Templates personalizables por cliente
- [ ] Integración con múltiples canales (Email, SMS)
- [ ] Dashboard de métricas de envío
- [ ] Notificaciones de lectura de documentos
- [ ] Envío masivo de documentos

### **Optimizaciones Técnicas**
- [ ] Cache de documentos generados
- [ ] Queue system para envíos masivos
- [ ] Compresión de PDFs
- [ ] Retry logic más sofisticado
- [ ] Rate limiting por cliente

---

## 📞 **Soporte**

Para dudas o problemas con el sistema de envío automático:

1. Revisar logs en `logs/bot.log`
2. Verificar health check en `/health`
3. Consultar tabla `document_sendings` para historial
4. Validar configuración de números de WhatsApp

**¡Sistema listo para automatizar completamente el envío de documentos!** 🚀