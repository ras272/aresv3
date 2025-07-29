import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, filename, data, mimetype } = await request.json();
    
    console.log('🔍 DEBUG WHATSAPP - Diagnóstico profundo');
    
    const client = (global as any).whatsappClient;
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Cliente WhatsApp no inicializado'
      });
    }

    // Formatear número
    let phoneNumber = to.replace(/\D/g, '');
    if (!phoneNumber.startsWith('595')) {
      phoneNumber = '595' + phoneNumber;
    }
    phoneNumber = phoneNumber + '@c.us';

    console.log('🔍 Número formateado:', phoneNumber);

    // Verificar que el número existe en WhatsApp
    console.log('🔍 Verificando si el número existe en WhatsApp...');
    try {
      const numberId = await client.getNumberId(phoneNumber);
      console.log('✅ Número verificado:', numberId);
    } catch (error) {
      console.log('❌ Error verificando número:', error);
      return NextResponse.json({
        success: false,
        error: 'Número no válido en WhatsApp: ' + error.message
      });
    }

    // Crear archivo temporal más pequeño para prueba
    const fs = require('fs');
    const path = require('path');
    
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Crear un archivo de texto simple primero
    const testTextContent = `🧪 ARCHIVO DE PRUEBA WHATSAPP
Fecha: ${new Date().toLocaleString()}
Archivo original: ${filename}
Tamaño original: ${data.length} chars base64

Este es un archivo de prueba para verificar que WhatsApp puede enviar archivos.
Si recibes este archivo, significa que el envío de archivos funciona.

¡Prueba exitosa! 🎉`;

    const testTextPath = path.join(tempDir, `debug_test_${Date.now()}.txt`);
    fs.writeFileSync(testTextPath, testTextContent, 'utf8');

    console.log('📁 Archivo de prueba creado:', {
      path: testTextPath,
      size: fs.statSync(testTextPath).size,
      exists: fs.existsSync(testTextPath)
    });

    const { MessageMedia } = require('whatsapp-web.js');

    // PRUEBA 1: Archivo de texto simple
    console.log('🧪 PRUEBA 1: Enviando archivo de texto simple...');
    try {
      const textMedia = MessageMedia.fromFilePath(testTextPath);
      console.log('📊 Media de texto:', {
        mimetype: textMedia.mimetype,
        filename: textMedia.filename,
        hasData: !!textMedia.data,
        dataLength: textMedia.data?.length
      });

      const textResult = await client.sendMessage(phoneNumber, textMedia, {
        sendMediaAsDocument: true,
        caption: '🧪 Archivo de prueba - texto simple'
      });

      console.log('✅ Archivo de texto enviado:', textResult.id._serialized);
    } catch (textError) {
      console.log('❌ Error enviando archivo de texto:', textError);
    }

    // PRUEBA 2: Archivo original pero más pequeño
    console.log('🧪 PRUEBA 2: Enviando archivo original...');
    try {
      const originalBuffer = Buffer.from(data, 'base64');
      const originalPath = path.join(tempDir, `debug_original_${Date.now()}_${filename}`);
      fs.writeFileSync(originalPath, originalBuffer);

      console.log('📁 Archivo original recreado:', {
        path: originalPath,
        size: fs.statSync(originalPath).size,
        exists: fs.existsSync(originalPath)
      });

      const originalMedia = MessageMedia.fromFilePath(originalPath);
      console.log('📊 Media original:', {
        mimetype: originalMedia.mimetype,
        filename: originalMedia.filename,
        hasData: !!originalMedia.data,
        dataLength: originalMedia.data?.length
      });

      const originalResult = await client.sendMessage(phoneNumber, originalMedia, {
        sendMediaAsDocument: true,
        caption: `📎 ${filename} (archivo original)`
      });

      console.log('✅ Archivo original enviado:', originalResult.id._serialized);

      // Limpiar archivos temporales
      fs.unlinkSync(testTextPath);
      fs.unlinkSync(originalPath);

    } catch (originalError) {
      console.log('❌ Error enviando archivo original:', originalError);
    }

    // PRUEBA 3: Verificar estado del cliente después del envío
    console.log('🔍 PRUEBA 3: Verificando estado del cliente...');
    try {
      const clientState = await client.getState();
      console.log('📱 Estado del cliente:', clientState);

      const clientInfo = client.info;
      console.log('📱 Info del cliente:', {
        wid: clientInfo?.wid?.user,
        pushname: clientInfo?.pushname,
        connected: !!clientInfo
      });

    } catch (stateError) {
      console.log('❌ Error verificando estado:', stateError);
    }

    // PRUEBA 4: Enviar mensaje de confirmación
    console.log('🧪 PRUEBA 4: Enviando mensaje de confirmación...');
    try {
      const confirmMessage = `🔍 DEBUG COMPLETADO
      
✅ Archivo de texto: Enviado
✅ Archivo original: Enviado
📱 Cliente: Conectado

Si NO recibes los archivos pero SÍ recibes este mensaje, el problema es específico con el envío de archivos en whatsapp-web.js.

Hora: ${new Date().toLocaleString()}`;

      const confirmResult = await client.sendMessage(phoneNumber, confirmMessage);
      console.log('✅ Mensaje de confirmación enviado:', confirmResult.id._serialized);

    } catch (confirmError) {
      console.log('❌ Error enviando confirmación:', confirmError);
    }

    return NextResponse.json({
      success: true,
      message: 'Debug completado. Revisa tu WhatsApp y la consola.',
      tests: [
        'Archivo de texto simple',
        'Archivo original',
        'Estado del cliente',
        'Mensaje de confirmación'
      ]
    });

  } catch (error) {
    console.error('❌ Error en debug:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}