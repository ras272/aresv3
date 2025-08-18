import dotenv from 'dotenv';

dotenv.config();

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
  },
  whatsapp: {
    groupName: process.env.WHATSAPP_GROUP_NAME || 'ServTec ARES',
    javierPhone: process.env.JAVIER_PHONE!,
    jefaPhone: process.env.JEFA_PHONE!,
  },
  bot: {
    name: process.env.BOT_NAME || 'ARES Bot',
    environment: process.env.ENVIRONMENT || 'development',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

// Validar configuración requerida
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JAVIER_PHONE',
  'JEFA_PHONE',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}