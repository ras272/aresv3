import winston from 'winston';
import { config } from '../config';

// Configurar formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configurar transports
const transports: winston.transport[] = [
  // Logs de error
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Logs combinados
  new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
];

// En desarrollo, también mostrar en consola
if (config.bot.environment === 'development') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// Crear logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  // Evitar que el proceso se cierre por errores no manejados
  exitOnError: false
});

// Función helper para logs estructurados
export const logWithContext = (level: string, message: string, context?: any) => {
  logger.log(level, message, {
    timestamp: new Date().toISOString(),
    context,
    service: 'ares-whatsapp-bot'
  });
};