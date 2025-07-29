import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to } = await request.json();
    
    console.log('🧪 TEST CLAUDE - Archivo local con código de Claude');
    
    const client = (global as any).whatsappClient;
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Cliente WhatsApp no inicializado'
      });
    }

    // Formatear número usando método de Claude
    function formatearNumero(numero: string): string {
      let numeroLimpio = numero.replace(/\D/g, '');
      if (!numeroLimpio.startsWith('595') && numeroLimpio.length === 9) {
        numeroLimpio = '595' + numeroLimpio;
      }
      return numeroLimpio + '@c.us';
    }

    const numeroDestino = formatearNumero(to);
    console.log('📱 Número formateado:', numeroDestino);

    const fs = require('fs');
    const path = require('path');
    const { MessageMedia } = require('whatsapp-web.js');

    // Usar archivo local que ya existe
    const rutaArchivo = path.join(process.cwd(), 'test-file.pdf');
    
    console.log('📁 Verificando archivo local:', {
      path: rutaArchivo,
      exists: fs.existsSync(rutaArchivo),
      size: fs.existsSync(rutaArchivo) ? fs.statSync(rutaArchivo).size : 0
    });

    if (!fs.existsSync(rutaArchivo)) {
      return NextResponse.json({
        success: false,
        error: 'Archivo test-file.pdf no encontrado'
      });
    }

    // CÓDIGO EXACTO DE CLAUDE - Método 1: fromFilePath (recomendado)
    console.log('🧪 EJECUTANDO CÓDIGO EXACTO DE CLAUDE:');
    console.log('const media = MessageMedia.fromFilePath(rutaArchivo);');
    console.log('await client.sendMessage(numeroDestino, media, { caption: caption });');

    try {
      // Verificar que el archivo existe (como en código de Claude)
      if (!fs.existsSync(rutaArchivo)) {
        throw new Error('El archivo no existe');
      }

      // Crear MessageMedia desde la ruta del archivo (CÓDIGO DE CLAUDE)
      const media = MessageMedia.fromFilePath(rutaArchivo);
      
      console.log('📊 Media creado con método de Claude:', {
        mimetype: media.mimetype,
        filename: media.filename,
        hasData: !!media.data,
        dataLength: media.data?.length
      });

      // Enviar el archivo (CÓDIGO DE CLAUDE)
      const caption = '📎 Archivo enviado con código exacto de Claude';
      const response = await client.sendMessage(numeroDestino, media, {
        caption: caption
      });

      console.log('✅ Archivo enviado exitosamente con Claude:', response.id._serialized);

      // Mensaje de confirmación
      const confirmMessage = `🧪 TEST CLAUDE COMPLETADO

Método usado: MessageMedia.fromFilePath() (recomendado por Claude)
Archivo: test-file.pdf (${fs.statSync(rutaArchivo).size} bytes)
Resultado: ${response.id ? '✅ Enviado' : '❌ Error'}
ID: ${response.id._serialized}

Si NO recibes el PDF pero SÍ este mensaje, el problema persiste incluso con el código de Claude.

Hora: ${new Date().toLocaleString()}`;

      await client.sendMessage(numeroDestino, confirmMessage);

      return NextResponse.json({
        success: true,
        messageId: response.id._serialized,
        message: 'Archivo enviado con código exacto de Claude',
        fileSize: fs.statSync(rutaArchivo).size
      });

    } catch (error) {
      console.error('❌ Error con código de Claude:', error);
      
      // Enviar mensaje de error
      const errorMessage = `❌ ERROR CON CÓDIGO DE CLAUDE

Error: ${error instanceof Error ? error.message : 'Error desconocido'}

El código exacto de Claude falló al enviar el archivo.

Hora: ${new Date().toLocaleString()}`;

      await client.sendMessage(numeroDestino, errorMessage);

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

  } catch (error) {
    console.error('❌ Error en test Claude:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}