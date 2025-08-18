import * as cron from 'node-cron';
import { BotController } from '../bot/botController';
import { logger } from '../utils/logger';

export class TaskScheduler {
  private botController: BotController;
  private tasks: cron.ScheduledTask[] = [];

  constructor(botController: BotController) {
    this.botController = botController;
  }

  /**
   * Iniciar todas las tareas programadas
   */
  start(): void {
    logger.info('Starting scheduled tasks');

    // Seguimiento inteligente cada 2 horas (horario laboral)
    const followUpTask = cron.schedule('0 8,10,12,14,16,18 * * 1-6', async () => {
      logger.info('Running follow-up task');
      try {
        await this.botController.processFollowUp();
      } catch (error) {
        logger.error('Error in follow-up task', { error });
      }
    }, {
      scheduled: false,
      timezone: 'America/Asuncion'
    });

    // Reporte diario a las 18:00
    const dailyReportTask = cron.schedule('0 18 * * *', async () => {
      logger.info('Running daily report task');
      try {
        await this.botController.generateDailyReport();
      } catch (error) {
        logger.error('Error in daily report task', { error });
      }
    }, {
      scheduled: false,
      timezone: 'America/Asuncion'
    });

    // Heartbeat cada hora para verificar que el bot está funcionando
    const heartbeatTask = cron.schedule('0 * * * *', () => {
      logger.info('Bot heartbeat - system is running');
    }, {
      scheduled: false,
      timezone: 'America/Asuncion'
    });

    // Limpieza de logs antiguos - cada domingo a las 2:00 AM
    const logCleanupTask = cron.schedule('0 2 * * 0', () => {
      logger.info('Running log cleanup task');
      // Los logs se rotan automáticamente por winston, pero podemos hacer limpieza adicional aquí
    }, {
      scheduled: false,
      timezone: 'America/Asuncion'
    });

    // Guardar referencias y iniciar tareas
    this.tasks = [followUpTask, dailyReportTask, heartbeatTask, logCleanupTask];
    
    this.tasks.forEach(task => task.start());

    logger.info('All scheduled tasks started successfully', {
      taskCount: this.tasks.length,
      tasks: [
        'Follow-up: Every 4 hours',
        'Daily report: 18:00',
        'Heartbeat: Every hour',
        'Log cleanup: Sunday 2:00 AM'
      ]
    });
  }

  /**
   * Detener todas las tareas programadas
   */
  stop(): void {
    logger.info('Stopping scheduled tasks');
    
    this.tasks.forEach(task => {
      if (task) {
        task.stop();
      }
    });

    this.tasks = [];
    logger.info('All scheduled tasks stopped');
  }

  /**
   * estado de las tareas
   */
  getStatus(): { running: boolean; taskCount: number } {
    return {
      running: this.tasks.length > 0,
      taskCount: this.tasks.length
    };
  }
}