#!/usr/bin/env node

/**
 * Script para actualizar las contraseñas de texto plano a hashes bcrypt
 * Uso: node scripts/migrate-passwords.js
 * Este script busca usuarios con contraseñas en texto plano y las convierte a hashes bcrypt
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ovmodvuelqasgsdrbptk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bW9kdnVlbHFhc2dzZHJicHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDUzNjYsImV4cCI6MjA2NjI4MTM2Nn0.OAey7qYJ23NVJycRs2fslqQ1eHcMIhY98P1NQfW9Th4';

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function hashPassword(password) {
  const rounds = 12;
  return await bcrypt.hash(password, rounds);
}

function isPasswordHash(str) {
  // Verificamos si ya parece un hash de bcrypt (comienza con $2a$, $2b$ o $2y$)
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(str);
}

async function migratePasswords() {
  console.log('🚀 Migración de Contraseñas - Sistema Ares Paraguay');
  console.log('===============================================\n');

  try {
    // Obtener todos los usuarios
    console.log('🔍 Buscando usuarios con contraseñas en texto plano...');
    const { data: usuarios, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, password_hash');

    if (userError) {
      console.error('❌ Error al obtener usuarios:', userError.message);
      process.exit(1);
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('✅ No se encontraron usuarios para migrar.');
      process.exit(0);
    }

    console.log(`👥 Se encontraron ${usuarios.length} usuarios en total.`);

    // Filtrar usuarios que parezcan tener contraseñas en texto plano
    const usuariosParaMigrar = usuarios.filter(user => !isPasswordHash(user.password_hash));
    
    console.log(`🔄 Usuarios con contraseñas en texto plano: ${usuariosParaMigrar.length}`);

    if (usuariosParaMigrar.length === 0) {
      console.log('✅ Todas las contraseñas ya están hasheadas correctamente.');
      process.exit(0);
    }

    // Mostrar usuarios que se migrarán
    console.log('\n📋 Usuarios que serán migrados:');
    usuariosParaMigrar.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nombre} (${user.email})`);
    });

    const confirm = await question('\n⚠️ ADVERTENCIA: Esta acción hasheará todas las contraseñas en texto plano.\n✅ ¿Continuar con la migración? (s/n): ');
    
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'si') {
      console.log('❌ Operación cancelada');
      process.exit(0);
    }

    // Actualizar contraseñas
    console.log('\n🔄 Migrando contraseñas...');
    
    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usuariosParaMigrar) {
      try {
        // Hashear la contraseña actual
        const passwordHash = await hashPassword(user.password_hash);
        
        // Actualizar en la base de datos
        const { error } = await supabase
          .from('usuarios')
          .update({ password_hash: passwordHash })
          .eq('id', user.id);

        if (error) {
          console.error(`❌ Error al actualizar ${user.email}: ${error.message}`);
          errorCount++;
          continue;
        }

        console.log(`✅ Migrado: ${user.email}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error con usuario ${user.email}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n===============================================');
    console.log(`✅ Migración completada. Resultados:`);
    console.log(`   - Usuarios migrados exitosamente: ${migratedCount}`);
    console.log(`   - Errores: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️ Algunos usuarios no se pudieron migrar. Revisa los errores arriba.');
    } else {
      console.log('\n🎉 Todas las contraseñas han sido migradas exitosamente a bcrypt!');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    rl.close();
  }
}

// Verificar que estamos en el directorio correcto
if (!require('fs').existsSync('package.json')) {
  console.error('❌ Ejecuta este script desde la raíz del proyecto');
  process.exit(1);
}

// Ejecutar
migratePasswords();