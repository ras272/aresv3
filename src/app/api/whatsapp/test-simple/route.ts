import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, filename, data } = await request.json();
    
    console.log('🧪 TEST SIMPLE - Código exacto del Discord');
    
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

    console.log('📱 Número formateado:', phoneNumber);

    // Crear archivo temporal exactamente como en el ejemplo
    const fs = require('fs');
    const path = require('path');
    
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Crear archivo con el nombre exacto del ejemplo
    const testFilePath = path.join(tempDir, 'teste.pdf');
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(testFilePath, buffer);

    console.log('📁 Archivo creado:', {
      path: testFilePath,
      size: fs.statSync(testFilePath).size,
      exists: fs.existsSync(testFilePath)
    });

    const { MessageMedia } = require('whatsapp-web.js');

    console.log('🧪 USANDO CÓDIGO EXACTO DEL DISCORD:');
    console.log('const pdf = await MessageMedia.fromFilePath("teste.pdf");');
    console.log('await client.sendMessage("xxxxxxx@c.us", pdf);');

    // CÓDIGO EXACTO DEL DISCORD
    const pdf = await MessageMedia.fromFilePath(testFilePath);
    console.log('📊 PDF creado:', {
      mimetype: pdf.mimetype,
      filename: pdf.filename,
      hasData: !!pdf.data,
      dataLength: pdf.data?.length
    });

    const result = await client.sendMessage(phoneNumber, pdf);
    console.log('✅ Resultado:', result.id._serialized);

    // Limpiar archivo
    fs.unlinkSync(testFilePath);

    // Enviar mensaje de confirmación
    const confirmMessage = `🧪 TEST SIMPLE COMPLETADO

Código usado (exacto del Discord):
const pdf = await MessageMedia.fromFilePath('teste.pdf');
await client.sendMessage('${phoneNumber}', pdf);

Resultado: ${result.id ? '✅ Enviado' : '❌ Error'}
ID: ${result.id._serialized}

Si NO recibes el archivo PDF pero SÍ este mensaje, el problema persiste.

Hora: ${new Date().toLocaleString()}`;

    await client.sendMessage(phoneNumber, confirmMessage);

    return NextResponse.json({
      success: true,
      messageId: result.id._serialized,
      message: 'Test simple completado - código exacto del Discord'
    });

  } catch (error) {
    console.error('❌ Error en test simple:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}