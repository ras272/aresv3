import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to } = await request.json();
    
    console.log('📁 TEST FILE SYSTEM - PDF desde servidor');
    
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

    const fs = require('fs');
    const path = require('path');
    const { MessageMedia } = require('whatsapp-web.js');

    // Ruta del PDF en el servidor
    const pdfPath = path.join(process.cwd(), 'test-file.pdf');
    
    console.log('📁 Verificando archivo:', {
      path: pdfPath,
      exists: fs.existsSync(pdfPath),
      size: fs.existsSync(pdfPath) ? fs.statSync(pdfPath).size : 0
    });

    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json({
        success: false,
        error: 'Archivo test-file.pdf no encontrado en el servidor'
      });
    }

    // MÉTODO 1: MessageMedia.fromFilePath() - CÓDIGO EXACTO DEL DISCORD
    console.log('🧪 MÉTODO 1: MessageMedia.fromFilePath() - Código del Discord');
    try {
      const pdf = await MessageMedia.fromFilePath(pdfPath);
      console.log('📊 PDF desde archivo:', {
        mimetype: pdf.mimetype,
        filename: pdf.filename,
        hasData: !!pdf.data,
        dataLength: pdf.data?.length
      });

      const result1 = await client.sendMessage(phoneNumber, pdf);
      console.log('✅ MÉTODO 1 enviado:', result1.id._serialized);
    } catch (error1) {
      console.log('❌ MÉTODO 1 falló:', error1.message);
    }

    // Esperar entre métodos
    await new Promise(resolve => setTimeout(resolve, 3000));

    // MÉTODO 2: Con opciones sendMediaAsDocument
    console.log('🧪 MÉTODO 2: Con sendMediaAsDocument');
    try {
      const pdf2 = await MessageMedia.fromFilePath(pdfPath);
      const result2 = await client.sendMessage(phoneNumber, pdf2, {
        sendMediaAsDocument: true,
        caption: '📁 PDF desde servidor con sendMediaAsDocument'
      });
      console.log('✅ MÉTODO 2 enviado:', result2.id._serialized);
    } catch (error2) {
      console.log('❌ MÉTODO 2 falló:', error2.message);
    }

    // Esperar entre métodos
    await new Promise(resolve => setTimeout(resolve, 3000));

    // MÉTODO 3: Leer archivo manualmente y crear MessageMedia
    console.log('🧪 MÉTODO 3: Leer archivo manualmente');
    try {
      const fileBuffer = fs.readFileSync(pdfPath);
      const base64Data = fileBuffer.toString('base64');
      
      const pdf3 = new MessageMedia('application/pdf', base64Data, 'test-manual.pdf');
      console.log('📊 PDF manual:', {
        mimetype: pdf3.mimetype,
        filename: pdf3.filename,
        hasData: !!pdf3.data,
        dataLength: pdf3.data?.length
      });

      const result3 = await client.sendMessage(phoneNumber, pdf3);
      console.log('✅ MÉTODO 3 enviado:', result3.id._serialized);
    } catch (error3) {
      console.log('❌ MÉTODO 3 falló:', error3.message);
    }

    // Mensaje de confirmación
    const confirmMessage = `📁 TEST FILE SYSTEM COMPLETADO

Se probaron 3 métodos con PDF desde servidor:

1. MessageMedia.fromFilePath() (código Discord)
2. fromFilePath() + sendMediaAsDocument  
3. Lectura manual + MessageMedia

Archivo: test-file.pdf (${fs.statSync(pdfPath).size} bytes)

Si NO recibes los PDFs pero SÍ este mensaje, confirma que el problema es con archivos en whatsapp-web.js.

Hora: ${new Date().toLocaleString()}`;

    await client.sendMessage(phoneNumber, confirmMessage);

    return NextResponse.json({
      success: true,
      message: 'Test file system completado',
      filePath: pdfPath,
      fileSize: fs.statSync(pdfPath).size
    });

  } catch (error) {
    console.error('❌ Error en test file system:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}