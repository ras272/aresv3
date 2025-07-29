// ===============================================
// WHATSAPP AUTOMATION PARA REPORTES
// ===============================================

import { Mantenimiento } from "@/types";

// Tipos para WhatsApp
export interface WhatsAppMessage {
  to: string; // Número de teléfono
  message: string;
  attachments?: Array<{
    filename: string;
    data: string; // Base64 string
    mimetype: string;
  }>;
}

export interface WhatsAppReportData {
  mantenimiento: Mantenimiento;
  equipo: any;
  cliente: {
    nombre: string;
    telefono?: string;
    contactoPrincipal?: string;
  };
  reportePDF?: {
    filename: string;
    data: Buffer;
  };
  attachments?: Array<{
    filename: string;
    data: string; // Base64 string
    mimetype: string;
  }>;
}

// ===============================================
// FUNCIONES PRINCIPALES
// ===============================================

/**
 * Enviar reporte de mantenimiento por WhatsApp
 */
export async function enviarReporteWhatsApp(data: WhatsAppReportData): Promise<{
  success: boolean;
  message: string;
  messageId?: string;
}> {
  try {
    console.log("📱 Iniciando envío de reporte por WhatsApp...", {
      cliente: data.cliente.nombre,
      telefono: data.cliente.telefono,
      mantenimiento: data.mantenimiento.id,
    });

    // Validar datos requeridos
    if (!data.cliente.telefono) {
      throw new Error("El cliente no tiene número de teléfono configurado");
    }

    // Generar mensaje de WhatsApp
    const mensaje = generarMensajeReporte(data);

    // Preparar attachments - usar los nuevos attachments si existen, sino usar reportePDF legacy
    let attachments = data.attachments;

    // Fallback para compatibilidad con código anterior
    if (!attachments && data.reportePDF) {
      // Convertir Buffer a base64 si es necesario
      const base64Data =
        data.reportePDF.data instanceof Buffer
          ? data.reportePDF.data.toString("base64")
          : data.reportePDF.data;

      attachments = [
        {
          filename: data.reportePDF.filename,
          data: base64Data,
          mimetype: "application/pdf",
        },
      ];
    }

    console.log(
      `📎 Preparando ${attachments?.length || 0} archivo(s) adjunto(s)`
    );

    // Enviar mensaje
    const resultado = await enviarMensajeWhatsApp({
      to: data.cliente.telefono,
      message: mensaje,
      attachments,
    });

    if (resultado.success) {
      console.log("✅ Reporte enviado por WhatsApp exitosamente");
      return {
        success: true,
        message: "Reporte enviado por WhatsApp exitosamente",
        messageId: resultado.messageId,
      };
    } else {
      throw new Error(resultado.error || "Error desconocido enviando WhatsApp");
    }
  } catch (error) {
    console.error("❌ Error enviando reporte por WhatsApp:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Generar mensaje de texto para WhatsApp
 */
function generarMensajeReporte(data: WhatsAppReportData): string {
  const { mantenimiento, equipo, cliente } = data;

  const fecha = new Date(mantenimiento.fecha).toLocaleDateString("es-PY");
  const precio = mantenimiento.precioServicio
    ? `₲ ${mantenimiento.precioServicio.toLocaleString("es-PY")}`
    : "No especificado";

  return `🔧 *REPORTE DE SERVICIO TÉCNICO*

📋 *Detalles del Servicio:*
• Cliente: ${cliente.nombre}
• Equipo: ${equipo.nombreEquipo}
• Marca: ${equipo.marca}
• Modelo: ${equipo.modelo}
• Fecha: ${fecha}

🔍 *Descripción del Trabajo:*
${mantenimiento.descripcion}

${
  mantenimiento.comentarios
    ? `💬 *Comentarios Técnicos:*
${mantenimiento.comentarios}

`
    : ""
}💰 *Precio del Servicio:* ${precio}

📄 *Estado:* ${mantenimiento.estado}

---
*Ares Paraguay - Servicio Técnico Especializado*
¿Consultas? Responde a este mensaje.`;
}

/**
 * Enviar mensaje de WhatsApp - IMPLEMENTACIÓN CON CÓDIGO DE CLAUDE
 */
async function enviarMensajeWhatsApp(data: WhatsAppMessage): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    console.log("📱 Enviando mensaje usando API directa...", {
      to: data.to,
      messageLength: data.message.length,
      hasAttachments: !!data.attachments?.length,
      attachmentsCount: data.attachments?.length || 0,
    });

    // USAR API DIRECTA PARA EVITAR PROBLEMAS DE CONTEXTO GLOBAL
    console.log("🔄 Usando API /api/whatsapp/enviar-reporte");
    
    const response = await fetch("/api/whatsapp/enviar-reporte", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: data.to,
        message: data.message,
        attachments: data.attachments
      }),
    });

    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.error || "Error en API de envío");
    }

    console.log("✅ Resultado de API:", resultado);

    return {
      success: resultado.success,
      messageId: resultado.messageId,
      error: resultado.error
    };

  } catch (error) {
    console.error("❌ Error en enviarMensajeWhatsApp:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Formatear número usando método de Claude
 */
function formatearNumero(numero: string): string {
  // Remover caracteres no numéricos
  let numeroLimpio = numero.replace(/\D/g, '');
  
  // Agregar código de país si no lo tiene (Paraguay: 595)
  if (!numeroLimpio.startsWith('595') && numeroLimpio.length === 9) {
    numeroLimpio = '595' + numeroLimpio;
  }
  
  return numeroLimpio + '@c.us';
}

// ===============================================
// FUNCIONES DE UTILIDAD
// ===============================================

/**
 * Validar número de teléfono para WhatsApp
 */
export function validarNumeroWhatsApp(telefono: string): {
  valido: boolean;
  numeroFormateado?: string;
  error?: string;
} {
  if (!telefono) {
    return { valido: false, error: "Número de teléfono requerido" };
  }

  // Limpiar número (solo dígitos)
  const numeroLimpio = telefono.replace(/\D/g, "");

  // Validar longitud para Paraguay (+595)
  if (numeroLimpio.length < 8 || numeroLimpio.length > 15) {
    return { valido: false, error: "Número de teléfono inválido" };
  }

  // Formatear para WhatsApp (agregar código de país si no existe)
  let numeroFormateado = numeroLimpio;
  if (!numeroFormateado.startsWith("595")) {
    numeroFormateado = "595" + numeroFormateado;
  }

  return {
    valido: true,
    numeroFormateado: numeroFormateado + "@c.us",
  };
}

/**
 * Obtener estado de WhatsApp - USA LA API QUE FUNCIONA
 */
export async function obtenerEstadoWhatsApp(): Promise<{
  conectado: boolean;
  sesionActiva: boolean;
  numeroConectado?: string;
  error?: string;
}> {
  try {
    console.log("📱 Verificando estado WhatsApp desde lib/whatsapp.ts...");

    // Llamar a la API de estado que funciona
    const response = await fetch("/api/whatsapp/status", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.error || "Error verificando estado");
    }

    console.log("✅ Estado WhatsApp obtenido desde lib:", resultado);
    return {
      conectado: resultado.conectado || false,
      sesionActiva: resultado.conectado || false,
      numeroConectado: resultado.numeroConectado,
      error: resultado.error
    };
    
  } catch (error) {
    console.error("❌ Error obteniendo estado WhatsApp:", error);
    return {
      conectado: false,
      sesionActiva: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Inicializar cliente de WhatsApp - USA LA API QUE FUNCIONA
 */
export async function inicializarWhatsApp(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log("📱 Inicializando WhatsApp desde lib/whatsapp.ts...");
    
    // Llamar a la API de inicialización que ya funciona
    const response = await fetch("/api/whatsapp/init-final", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.message || "Error inicializando WhatsApp");
    }

    console.log("✅ WhatsApp inicializado desde lib:", resultado);
    return resultado;
    
  } catch (error) {
    console.error("❌ Error inicializando WhatsApp:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}