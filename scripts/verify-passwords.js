#!/usr/bin/env node

/**
 * Script para verificar el formato de las contraseñas almacenadas
 * Uso: node scripts/verify-passwords.js
 * Este script verifica si las contraseñas están en formato bcrypt correcto
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ovmodvuelqasgsdrbptk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bW9kdnVlbHFhc2dzZHJicHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDUzNjYsImV4cCI6MjA2NjI4MTM2Nn0.OAey7qYJ23NVJycRs2fslqQ1eHcMIhY98P1NQfW9Th4';

const supabase = createClient(supabaseUrl, supabaseKey);

function isPasswordHash(str) {
  // Verificamos si ya parece un hash de bcrypt (comienza con $2a$, $2b$ o $2y$)
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(str);
}

async function verifyPasswords() {
  console.log('🔍 Verificación de Contraseñas - Sistema Ares Paraguay');
  console.log('===============================================\n');

  try {
    // Obtener todos los usuarios
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, password_hash, activo');

    if (userError) {
      console.error('❌ Error al obtener usuarios:', userError.message);
      process.exit(1);
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('ℹ️ No se encontraron usuarios.');
      process.exit(0);
    }

    console.log(`👥 Total de usuarios: ${usuarios.length}`);
    
    // Verificar formato de contraseñas
    const correctFormat = usuarios.filter(user => isPasswordHash(user.password_hash));
    const incorrectFormat = usuarios.filter(user => !isPasswordHash(user.password_hash));
    
    // Mostrar estadísticas
    console.log('\n📊 Estadísticas:');
    console.log(`✅ Contraseñas en formato correcto: ${correctFormat.length}`);
    console.log(`❌ Contraseñas en formato incorrecto: ${incorrectFormat.length}`);
    console.log(`👤 Usuarios activos: ${usuarios.filter(u => u.activo).length}`);
    console.log(`🚫 Usuarios inactivos: ${usuarios.filter(u => !u.activo).length}`);
    
    // Mostrar detalles si hay contraseñas en formato incorrecto
    if (incorrectFormat.length > 0) {
      console.log('\n⚠️ Usuarios con contraseñas en formato incorrecto:');
      incorrectFormat.forEach(user => {
        const passwordPreview = user.password_hash.length > 10 
          ? `${user.password_hash.substring(0, 5)}...${user.password_hash.substring(user.password_hash.length - 5)}` 
          : user.password_hash;
        
        console.log(`- ${user.nombre} (${user.email}): ${passwordPreview}`);
      });
      
      console.log('\n❗️ Ejecuta el script de migración para corregir estos usuarios:');
      console.log('node scripts/migrate-passwords.js');
    } else {
      console.log('\n🎉 ¡Todas las contraseñas están en el formato correcto de bcrypt!');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Verificar que estamos en el directorio correcto
if (!require('fs').existsSync('package.json')) {
  console.error('❌ Ejecuta este script desde la raíz del proyecto');
  process.exit(1);
}

// Ejecutar
verifyPasswords();