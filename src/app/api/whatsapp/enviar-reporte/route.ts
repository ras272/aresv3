import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, message, attachments } = await request.json();
    
    console.log('📱 API ENVIAR REPORTE - Datos recibidos:', {
      to,
      messageLength: message?.length,
      attachmentsCount: attachments?.length || 0
    });

    const client = (global as any).whatsappClient;
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Cliente WhatsApp no inicializado'
      });
    }

    // Formatear número
    function formatearNumero(numero: string): string {
      let numeroLimpio = numero.replace(/\D/g, '');
      if (!numeroLimpio.startsWith('595') && numeroLimpio.length === 9) {
        numeroLimpio = '595' + numeroLimpio;
      }
      return numeroLimpio + '@c.us';
    }

    const numeroFormateado = formatearNumero(to);
    console.log('📱 Número formateado:', numeroFormateado);

    const results = [];

    // Enviar mensaje de texto
    if (message) {
      console.log('💬 Enviando mensaje de texto...');
      const textResult = await client.sendMessage(numeroFormateado, message);
      console.log('✅ Mensaje de texto enviado:', textResult.id._serialized);
      results.push({
        type: 'text',
        success: true,
        messageId: textResult.id._serialized
      });
    }

    // Enviar archivos como links de Cloudinary
    if (attachments && attachments.length > 0) {
      console.log(`📎 Procesando ${attachments.length} archivo(s)...`);

      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        console.log(`📎 Procesando archivo ${i + 1}: ${attachment.filename}`);

        try {
          // Subir a Cloudinary
          console.log(`☁️ Subiendo archivo a Cloudinary: ${attachment.filename}`);
          
          const fs = require('fs');
          const path = require('path');
          
          const tempDir = path.join(process.cwd(), 'temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${attachment.filename}`);
          const buffer = Buffer.from(attachment.data, 'base64');
          fs.writeFileSync(tempFilePath, buffer);

          console.log(`📁 Archivo temporal creado: ${tempFilePath} (${buffer.length} bytes)`);

          // Subir a Cloudinary
          const cloudinary = require('cloudinary').v2;
          
          // CONFIGURAR CLOUDINARY EXPLÍCITAMENTE
          cloudinary.config({
            cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
          });
          
          console.log('☁️ Cloudinary configurado explícitamente:', {
            cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY ? 'Configurado' : 'NO CONFIGURADO',
            api_secret: process.env.CLOUDINARY_API_SECRET ? 'Configurado' : 'NO CONFIGURADO'
          });
          
          const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
            resource_type: 'auto',
            public_id: `reportes/${Date.now()}_${attachment.filename.replace(/\.[^/.]+$/, "")}`,
            use_filename: true,
            unique_filename: true
          });

          console.log(`☁️ Archivo subido a Cloudinary EXITOSAMENTE:`, {
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            size: uploadResult.bytes,
            format: uploadResult.format
          });

          // Limpiar archivo temporal
          fs.unlinkSync(tempFilePath);

          // Enviar link por WhatsApp
          const linkMessage = `📎 **${attachment.filename}**

🔗 **Descargar archivo:**
${uploadResult.secure_url}

📊 **Detalles:**
• Tamaño: ${Math.round(uploadResult.bytes / 1024)} KB
• Tipo: ${attachment.mimetype}
• Fecha: ${new Date().toLocaleString()}

💡 *Haz clic en el link para descargar el archivo*`;

          const linkResult = await client.sendMessage(numeroFormateado, linkMessage);
          console.log(`✅ Link de archivo ${i + 1} enviado:`, linkResult.id._serialized);

          results.push({
            type: 'file_link',
            success: true,
            messageId: linkResult.id._serialized,
            filename: attachment.filename,
            cloudinaryUrl: uploadResult.secure_url
          });

          // Pausa entre archivos
          if (i < attachments.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (fileError) {
          console.error(`❌ Error con archivo ${attachment.filename}:`, fileError);
          results.push({
            type: 'file',
            success: false,
            error: fileError instanceof Error ? fileError.message : "Error desconocido",
            filename: attachment.filename
          });
        }
      }
    }

    // Verificar resultados
    const successfulResults = results.filter(r => r.success);

    console.log("📊 Resumen de envío:", {
      total: results.length,
      exitosos: successfulResults.length,
      fallidos: results.filter(r => !r.success).length
    });

    return NextResponse.json({
      success: successfulResults.length > 0,
      messageId: successfulResults[0]?.messageId,
      results: results
    });

  } catch (error) {
    console.error('❌ Error en API enviar reporte:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}