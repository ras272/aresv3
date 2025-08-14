#!/usr/bin/env node

/**
 * Script para crear usuarios de prueba en el sistema Ares
 * Uso: node scripts/create-test-users.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ovmodvuelqasgsdrbptk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bW9kdnVlbHFhc2dzZHJicHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDUzNjYsImV4cCI6MjA2NjI4MTM2Nn0.OAey7qYJ23NVJycRs2fslqQ1eHcMIhY98P1NQfW9Th4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function hashPassword(password) {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, rounds);
}

// Usuarios de prueba
const testUsers = [
  {
    nombre: 'Ana García - Administradora',
    email: 'ana.garcia@arestech.com',
    password: 'admin123',
    rol: 'admin',
    activo: true
  },
  {
    nombre: 'Carlos Mendoza - Contabilidad',
    email: 'carlos.mendoza@arestech.com', 
    password: 'conta123',
    rol: 'contabilidad',
    activo: true
  },
  {
    nombre: 'Luis Rodríguez - Técnico Senior',
    email: 'luis.rodriguez@arestech.com',
    password: 'tecnico123',
    rol: 'tecnico',
    activo: true
  },
  {
    nombre: 'María Fernández - Técnico Junior',
    email: 'maria.fernandez@arestech.com',
    password: 'tecnico456',
    rol: 'tecnico',
    activo: true
  },
  {
    nombre: 'Pedro Silva - Gerente',
    email: 'pedro.silva@arestech.com',
    password: 'gerente123',
    rol: 'admin',
    activo: true
  }
];

async function createTestUsers() {
  console.log('🚀 Creando Usuarios de Prueba - Sistema Ares Paraguay');
  console.log('====================================================\n');

  for (const user of testUsers) {
    try {
      console.log(`👤 Creando usuario: ${user.nombre}`);
      
      // Hash de la contraseña
      const passwordHash = await hashPassword(user.password);

      // Crear usuario en la base de datos
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          nombre: user.nombre,
          email: user.email,
          password_hash: passwordHash,
          rol: user.rol,
          activo: user.activo
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`   ⚠️  Usuario ya existe: ${user.email}`);
        } else {
          console.error(`   ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Creado exitosamente - ID: ${data.id}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔐 Password: ${user.password}`);
        console.log(`   🎯 Rol: ${user.rol}\n`);
      }

    } catch (error) {
      console.error(`   ❌ Error creando ${user.nombre}:`, error.message);
    }
  }

  console.log('✅ Proceso completado!');
  console.log('\n📋 Resumen de credenciales:');
  console.log('================================');
  
  testUsers.forEach(user => {
    console.log(`${user.nombre}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(`  Rol: ${user.rol}\n`);
  });

  console.log('⚠️  IMPORTANTE: Estas son credenciales de prueba.');
  console.log('   Cámbialas en producción por seguridad.');
}

// Verificar que estamos en el directorio correcto
if (!require('fs').existsSync('package.json')) {
  console.error('❌ Ejecuta este script desde la raíz del proyecto');
  process.exit(1);
}

// Ejecutar
createTestUsers();