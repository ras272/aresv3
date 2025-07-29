import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to } = await request.json();
    
    console.log('🔍 DEBUG FILES - Pruebas específicas de archivos');
    
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

    const fs = require('fs');
    const path = require('path');
    const { MessageMedia } = require('whatsapp-web.js');
    
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const results = [];

    // TEST 1: Archivo de texto muy pequeño (menos de 1KB)
    console.log('🧪 TEST 1: Archivo de texto muy pequeño...');
    try {
      const smallText = 'Hola, este es un archivo de prueba muy pequeño.';
      const smallPath = path.join(tempDir, 'test_small.txt');
      fs.writeFileSync(smallPath, smallText, 'utf8');
      
      const smallMedia = MessageMedia.fromFilePath(smallPath);
      console.log('📊 Archivo pequeño:', {
        size: fs.statSync(smallPath).size,
        mimetype: smallMedia.mimetype,
        dataLength: smallMedia.data?.length
      });
      
      const result1 = await client.sendMessage(phoneNumber, smallMedia, {
        sendMediaAsDocument: true,
        caption: '🧪 TEST 1: Archivo muy pequeño'
      });
      
      results.push({
        test: 'Archivo pequeño (texto)',
        size: fs.statSync(smallPath).size,
        success: !!result1.id,
        messageId: result1.id._serialized
      });
      
      fs.unlinkSync(smallPath);
      console.log('✅ TEST 1 completado');
    } catch (error) {
      console.log('❌ TEST 1 falló:', error.message);
      results.push({
        test: 'Archivo pequeño (texto)',
        success: false,
        error: error.message
      });
    }

    // Esperar entre tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // TEST 2: Imagen PNG pequeña
    console.log('🧪 TEST 2: Imagen PNG pequeña...');
    try {
      // Crear una imagen PNG muy simple (1x1 pixel)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, // End
        0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      const pngPath = path.join(tempDir, 'test_small.png');
      fs.writeFileSync(pngPath, pngBuffer);
      
      const pngMedia = MessageMedia.fromFilePath(pngPath);
      console.log('📊 Imagen PNG:', {
        size: fs.statSync(pngPath).size,
        mimetype: pngMedia.mimetype,
        dataLength: pngMedia.data?.length
      });
      
      const result2 = await client.sendMessage(phoneNumber, pngMedia, {
        sendMediaAsDocument: true,
        caption: '🧪 TEST 2: Imagen PNG pequeña'
      });
      
      results.push({
        test: 'Imagen PNG pequeña',
        size: fs.statSync(pngPath).size,
        success: !!result2.id,
        messageId: result2.id._serialized
      });
      
      fs.unlinkSync(pngPath);
      console.log('✅ TEST 2 completado');
    } catch (error) {
      console.log('❌ TEST 2 falló:', error.message);
      results.push({
        test: 'Imagen PNG pequeña',
        success: false,
        error: error.message
      });
    }

    // Esperar entre tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // TEST 3: PDF muy pequeño
    console.log('🧪 TEST 3: PDF muy pequeño...');
    try {
      // PDF mínimo válido
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`;
      
      const pdfPath = path.join(tempDir, 'test_small.pdf');
      fs.writeFileSync(pdfPath, pdfContent, 'utf8');
      
      const pdfMedia = MessageMedia.fromFilePath(pdfPath);
      console.log('📊 PDF pequeño:', {
        size: fs.statSync(pdfPath).size,
        mimetype: pdfMedia.mimetype,
        dataLength: pdfMedia.data?.length
      });
      
      const result3 = await client.sendMessage(phoneNumber, pdfMedia, {
        sendMediaAsDocument: true,
        caption: '🧪 TEST 3: PDF muy pequeño'
      });
      
      results.push({
        test: 'PDF muy pequeño',
        size: fs.statSync(pdfPath).size,
        success: !!result3.id,
        messageId: result3.id._serialized
      });
      
      fs.unlinkSync(pdfPath);
      console.log('✅ TEST 3 completado');
    } catch (error) {
      console.log('❌ TEST 3 falló:', error.message);
      results.push({
        test: 'PDF muy pequeño',
        success: false,
        error: error.message
      });
    }

    // Esperar entre tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // TEST 4: Probar sin sendMediaAsDocument
    console.log('🧪 TEST 4: Archivo sin sendMediaAsDocument...');
    try {
      const normalText = 'Test sin sendMediaAsDocument';
      const normalPath = path.join(tempDir, 'test_normal.txt');
      fs.writeFileSync(normalPath, normalText, 'utf8');
      
      const normalMedia = MessageMedia.fromFilePath(normalPath);
      
      // SIN sendMediaAsDocument
      const result4 = await client.sendMessage(phoneNumber, normalMedia, {
        caption: '🧪 TEST 4: Sin sendMediaAsDocument'
      });
      
      results.push({
        test: 'Sin sendMediaAsDocument',
        size: fs.statSync(normalPath).size,
        success: !!result4.id,
        messageId: result4.id._serialized
      });
      
      fs.unlinkSync(normalPath);
      console.log('✅ TEST 4 completado');
    } catch (error) {
      console.log('❌ TEST 4 falló:', error.message);
      results.push({
        test: 'Sin sendMediaAsDocument',
        success: false,
        error: error.message
      });
    }

    // Mensaje de resumen
    const summary = `🔍 DEBUG FILES COMPLETADO

Resultados:
${results.map((r, i) => `${i+1}. ${r.test}: ${r.success ? '✅' : '❌'} ${r.size ? `(${r.size} bytes)` : ''}`).join('\n')}

Si NO recibes ningún archivo pero SÍ este mensaje, el problema es específico con archivos en whatsapp-web.js.

Hora: ${new Date().toLocaleString()}`;

    await client.sendMessage(phoneNumber, summary);

    return NextResponse.json({
      success: true,
      message: 'Debug de archivos completado',
      results: results
    });

  } catch (error) {
    console.error('❌ Error en debug files:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}