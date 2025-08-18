import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface EnviarReporteRequest {
  ticketId: string;
}

/**
 * API endpoint para enviar reportes por WhatsApp
 * Conecta la aplicación web con el bot de WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId } = body as EnviarReporteRequest;

    // Validar parámetros
    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: 'ticketId es requerido' },
        { status: 400 }
      );
    }

    logger.info('WhatsApp report sending request received', { ticketId });

    // URL del bot de WhatsApp (debe estar configurada en variables de entorno)
    const whatsappBotUrl = process.env.WHATSAPP_BOT_URL || 'http://localhost:3000';
    
    try {
      // Hacer petición al bot de WhatsApp
      const response = await fetch(`${whatsappBotUrl}/api/send-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        logger.info('Document sent successfully via WhatsApp bot', { 
          ticketId, 
          phone: result.phone,
          sentDocuments: result.sentDocuments
        });

        return NextResponse.json({
          success: true,
          message: result.message || 'Documentos enviados por WhatsApp',
          phone: result.phone,
          sentDocuments: result.sentDocuments
        });
      } else {
        logger.error('Error from WhatsApp bot', { error: result.error, ticketId });
        return NextResponse.json(
          { success: false, error: result.error || 'Error enviando por WhatsApp' },
          { status: 400 }
        );
      }
    } catch (fetchError) {
      logger.error('Error connecting to WhatsApp bot', { fetchError, ticketId });
      
      // Si no podemos conectar con el bot, devolver error específico
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bot de WhatsApp no disponible. Verifique que esté ejecutándose.' 
        },
        { status: 503 }
      );
    }

  } catch (error) {
    logger.error('Error in WhatsApp report sending endpoint', { error });
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint GET para verificar estado del servicio
 */
export async function GET() {
  try {
    const whatsappBotUrl = process.env.WHATSAPP_BOT_URL || 'http://localhost:3000';
    
    // Verificar si el bot está disponible
    const response = await fetch(`${whatsappBotUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: response.ok,
      botAvailable: response.ok,
      whatsappReady: result.whatsappReady || false,
      botUrl: whatsappBotUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      botAvailable: false,
      whatsappReady: false,
      error: 'Bot no disponible',
      timestamp: new Date().toISOString()
    });
  }
}
