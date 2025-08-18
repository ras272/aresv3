import express from "express";
import cors from "cors";
import { WhatsAppService } from "./services/whatsappService";
import { BotController } from "./bot/botController";
import { TaskScheduler } from "./scheduler/taskScheduler";
import { logger } from "./utils/logger";
import { config } from "./config";

// Crear directorio de logs si no existe
import * as fs from "fs";
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs", { recursive: true });
}

class AresWhatsAppBot {
  private whatsappService: WhatsAppService;
  private botController: BotController;
  private taskScheduler: TaskScheduler;
  private expressApp: express.Application;

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.botController = new BotController(this.whatsappService);
    this.taskScheduler = new TaskScheduler(this.botController);
    this.expressApp = this.setupExpressApp();
  }

  /**
   * Configurar servidor Express para APIs
   */
  private setupExpressApp(): express.Application {
    const app = express();

    // Middlewares
    app.use(cors());
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));


    // Ruta de health check
    app.get("/health", (_, res) => {
      res.json({
        status: "ok",
        whatsappReady: this.whatsappService.isClientReady(),
        timestamp: new Date().toISOString(),
      });
    });

    // Endpoint temporal para test de mensajes
    app.post("/api/send-test-message", async (req, res) => {
      try {
        const { phone, message } = req.body;
        
        if (!phone || !message) {
          res.status(400).json({
            success: false,
            error: "phone y message son requeridos"
          });
        } else if (!this.whatsappService.isClientReady()) {
          res.status(503).json({
            success: false,
            error: "WhatsApp no está conectado"
          });
        } else {
          await this.whatsappService.sendMessage(phone, message);
          
          res.json({
            success: true,
            message: "Mensaje enviado exitosamente",
            phone,
            timestamp: new Date().toISOString()
          });
          
          logger.info('Test message sent', { phone: phone.substring(0, 8) + '***' });
        }
        
      } catch (error) {
        logger.error('Error sending test message', { error });
        res.status(500).json({
          success: false,
          error: 'Error enviando mensaje'
        });
      }
    });

    return app;
  }

  /**
   * Inicializar el bot completo
   */
  async start(): Promise<void> {
    try {
      logger.info("Starting ARES WhatsApp Bot", {
        environment: config.bot.environment,
        groupName: config.whatsapp.groupName,
      });

      // Inicializar WhatsApp
      await this.whatsappService.initialize();
      

      // Configurar manejador de mensajes
      this.whatsappService.onMessage(async (message) => {
        await this.botController.processMessage(message);
      });

      // Iniciar tareas programadas
      this.taskScheduler.start();

      // Iniciar servidor Express
      const port = process.env.PORT || 3000;
      this.expressApp.listen(port, () => {
        logger.info(`Express server started on port ${port}`);
      });

      logger.info("ARES WhatsApp Bot started successfully");

      // Mensaje de confirmación (solo en producción)
      if (config.bot.environment === "production") {
        setTimeout(async () => {
          if (this.whatsappService.isClientReady()) {
            await this.whatsappService.sendToServtecGroup(
              `🤖 Bot ARES activado correctamente ✅

Funcionalidades:
• Creación automática de tickets
• Seguimiento de casos pendientes  
• Reportes diarios automáticos
• Notificaciones inteligentes

¡Sistema listo para funcionar! 🚀`
            );
          }
        }, 10000); // Esperar 10 segundos para asegurar conexión
      }
    } catch (error) {
      logger.error("Failed to start ARES WhatsApp Bot", { error });
      process.exit(1);
    }
  }

  /**
   * Detener el bot de forma segura
   */
  async stop(): Promise<void> {
    try {
      logger.info("Stopping ARES WhatsApp Bot");

      this.taskScheduler.stop();
      await this.whatsappService.destroy();

      logger.info("ARES WhatsApp Bot stopped successfully");
    } catch (error) {
      logger.error("Error stopping bot", { error });
    }
  }
}

// Manejo de señales del sistema
const bot = new AresWhatsAppBot();

process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully");
  await bot.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully");
  await bot.stop();
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { reason, promise });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", { error });
  process.exit(1);
});

// Iniciar el bot
bot.start().catch((error) => {
  logger.error("Failed to start bot", { error });
  process.exit(1);
});
