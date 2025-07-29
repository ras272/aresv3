import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { to, message, type, filename, data, mimetype } =
      await request.json();

    console.log("🧪 TEST WHATSAPP - Datos recibidos:", {
      to,
      messageLength: message?.length,
      type,
      filename,
      hasData: !!data,
      dataLength: data?.length,
      mimetype,
    });

    // Verificar cliente WhatsApp
    const client = (global as any).whatsappClient;
    if (!client) {
      return NextResponse.json({
        success: false,
        error:
          "Cliente WhatsApp no inicializado. Ve a /whatsapp e inicializa primero.",
      });
    }

    // Formatear número de teléfono
    let phoneNumber = to.replace(/\D/g, "");
    if (!phoneNumber.startsWith("595")) {
      phoneNumber = "595" + phoneNumber;
    }
    phoneNumber = phoneNumber + "@c.us";

    console.log("📱 Número formateado:", phoneNumber);

    try {
      // CASO 1: Solo mensaje de texto
      if (type === "text") {
        console.log("💬 Enviando solo mensaje de texto...");

        const textResult = await client.sendMessage(phoneNumber, message);
        console.log("✅ Mensaje de texto enviado:", textResult.id._serialized);

        return NextResponse.json({
          success: true,
          messageId: textResult.id._serialized,
          type: "text",
          message: "Mensaje de texto enviado exitosamente",
        });
      }

      // CASO 2: Solo archivo
      if (type === "file") {
        console.log("📎 Enviando solo archivo...");
        console.log("📎 Detalles del archivo:", {
          filename,
          mimetype,
          dataLength: data.length,
        });

        const { MessageMedia } = require("whatsapp-web.js");

        // MÉTODO 1: MessageMedia desde base64 con opciones específicas
        console.log("🧪 MÉTODO 1: MessageMedia desde base64...");
        const media = new MessageMedia(mimetype, data, filename);
        console.log("📊 Media creado:", {
          mimetype: media.mimetype,
          filename: media.filename,
          hasData: !!media.data,
          dataLength: media.data?.length,
        });

        // Opciones específicas para archivos
        const sendOptions = {
          sendMediaAsDocument: true, // CRÍTICO: Enviar como documento
          caption: `📎 ${filename}`, // Agregar caption
          parseVCards: false,
        };

        console.log("📤 Enviando con opciones:", sendOptions);
        const fileResult = await client.sendMessage(
          phoneNumber,
          media,
          sendOptions
        );
        console.log(
          "✅ Archivo enviado (Método 1):",
          fileResult.id._serialized
        );

        // MÉTODO 2: Archivo temporal (como backup)
        console.log("🧪 MÉTODO 2: Archivo temporal...");
        const fs = require("fs");
        const path = require("path");

        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(
          tempDir,
          `test_${Date.now()}_${filename}`
        );
        const buffer = Buffer.from(data, "base64");
        fs.writeFileSync(tempFilePath, buffer);

        console.log("📁 Archivo temporal creado:", {
          path: tempFilePath,
          size: buffer.length,
          exists: fs.existsSync(tempFilePath),
        });

        const mediaFromFile = MessageMedia.fromFilePath(tempFilePath);
        console.log("📊 Media desde archivo:", {
          mimetype: mediaFromFile.mimetype,
          filename: mediaFromFile.filename,
          hasData: !!mediaFromFile.data,
        });

        const fileResult2 = await client.sendMessage(
          phoneNumber,
          mediaFromFile,
          sendOptions
        );
        console.log(
          "✅ Archivo enviado (Método 2):",
          fileResult2.id._serialized
        );

        // Limpiar archivo temporal
        fs.unlinkSync(tempFilePath);
        console.log("🧹 Archivo temporal eliminado");

        return NextResponse.json({
          success: true,
          messageId: fileResult.id._serialized,
          messageId2: fileResult2.id._serialized,
          type: "file",
          message: `Archivo enviado con ambos métodos: ${filename}`,
          methods: ["base64", "tempFile"],
        });
      }

      // CASO 3: Mensaje + archivo
      if (type === "both") {
        console.log("🚀 Enviando mensaje + archivo...");

        // Primero el mensaje
        console.log("💬 Enviando mensaje...");
        const textResult = await client.sendMessage(phoneNumber, message);
        console.log("✅ Mensaje enviado:", textResult.id._serialized);

        // Esperar un poco
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Luego el archivo
        console.log("📎 Enviando archivo...");
        const { MessageMedia } = require("whatsapp-web.js");
        const media = new MessageMedia(mimetype, data, filename);

        // Opciones específicas para archivos
        const sendOptions = {
          sendMediaAsDocument: true, // CRÍTICO: Enviar como documento
          caption: `📎 ${filename}`, // Agregar caption
          parseVCards: false,
        };

        const fileResult = await client.sendMessage(
          phoneNumber,
          media,
          sendOptions
        );
        console.log("✅ Archivo enviado:", fileResult.id._serialized);

        return NextResponse.json({
          success: true,
          textMessageId: textResult.id._serialized,
          fileMessageId: fileResult.id._serialized,
          type: "both",
          message: `Mensaje y archivo enviados: ${filename}`,
        });
      }

      return NextResponse.json({
        success: false,
        error: "Tipo de envío no válido",
      });
    } catch (sendError) {
      console.error("❌ Error enviando:", sendError);
      return NextResponse.json({
        success: false,
        error: `Error enviando: ${
          sendError instanceof Error ? sendError.message : sendError
        }`,
      });
    }
  } catch (error) {
    console.error("❌ Error en test-send:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
