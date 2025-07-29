import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("🚀 Inicializando WhatsApp para pruebas...");

    // Limpiar cliente anterior
    if ((global as any).whatsappClient) {
      try {
        await (global as any).whatsappClient.destroy();
        console.log("🧹 Cliente anterior limpiado");
      } catch (e) {
        console.log("⚠️ Error limpiando cliente anterior (ignorado)");
      }
      (global as any).whatsappClient = null;
    }

    const { Client, LocalAuth } = require("whatsapp-web.js");

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: "ares-test",
        dataPath: "./.wwebjs_auth_test",
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-first-run",
          "--disable-extensions",
        ],
      },
    });

    console.log("✅ Cliente creado, configurando eventos...");

    return new Promise((resolve) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(
            NextResponse.json({
              success: false,
              message: "Timeout después de 2 minutos",
            })
          );
        }
      }, 120000);

      client.on("qr", (qr: string) => {
        console.log("📱 ========================================");
        console.log("📱 QR CODE PARA PRUEBAS:");
        console.log("📱 ========================================");
        console.log(qr);
        console.log("📱 ========================================");
        console.log("📱 ESCANEA CON TU TELÉFONO PARA PROBAR");
        console.log("📱 ========================================");
      });

      // Agregar más eventos para diagnosticar
      client.on("loading_screen", (percent: number, message: string) => {
        console.log(`📱 Cargando: ${percent}% - ${message}`);
      });

      client.on("change_state", (state: string) => {
        console.log("📱 Cambio de estado:", state);
      });

      client.on("authenticated", () => {
        console.log("✅ WhatsApp autenticado para pruebas");
        console.log(
          '📱 Evento "authenticated" recibido - esperando "ready"...'
        );
      });

      client.on("ready", async () => {
        console.log("🎉 WhatsApp listo para pruebas");

        try {
          // Esperar un poco para que se estabilice
          await new Promise((resolve) => setTimeout(resolve, 3000));

          // Obtener información del cliente
          const clientInfo = client.info;
          console.log("📱 Info del cliente:", {
            wid: clientInfo?.wid?.user || "No disponible",
            pushname: clientInfo?.pushname || "Sin nombre",
            platform: clientInfo?.platform || "Desconocida",
          });

          // Guardar cliente globalmente
          (global as any).whatsappClient = client;
          console.log("✅ Cliente guardado para pruebas");

          // Verificar que se guardó
          const savedClient = (global as any).whatsappClient;
          if (savedClient && savedClient.info) {
            console.log("✅ Verificación: Cliente guardado correctamente");
          } else {
            console.log("⚠️ Advertencia: Cliente no se guardó correctamente");
          }

          clearTimeout(timeout);

          if (!resolved) {
            resolved = true;
            resolve(
              NextResponse.json({
                success: true,
                message: "WhatsApp inicializado para pruebas exitosamente",
                numeroConectado: clientInfo?.wid?.user || "Conectado",
                nombreUsuario: clientInfo?.pushname || "Sin nombre",
              })
            );
          }
        } catch (error) {
          console.error("❌ Error después del evento ready:", error);
          clearTimeout(timeout);

          if (!resolved) {
            resolved = true;
            resolve(
              NextResponse.json({
                success: false,
                message:
                  "Error después de la conexión: " +
                  (error instanceof Error
                    ? error.message
                    : "Error desconocido"),
              })
            );
          }
        }
      });

      client.on("auth_failure", () => {
        console.log("❌ Fallo de autenticación");
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          resolve(
            NextResponse.json({
              success: false,
              message: "Fallo de autenticación",
            })
          );
        }
      });

      client.on("disconnected", (reason: string) => {
        console.log("❌ Desconectado:", reason);
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          resolve(
            NextResponse.json({
              success: false,
              message: "Desconectado: " + reason,
            })
          );
        }
      });

      console.log("🚀 Inicializando cliente...");
      client.initialize();
    });
  } catch (error) {
    console.error("❌ Error inicializando:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
