#!/usr/bin/env node

/**
 * Script para crear usuarios en el sistema Ares
 * Uso: node scripts/create-user.js
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
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, rounds);
}

async function createUser() {
  console.log('🚀 Creador de Usuarios - Sistema Ares Paraguay');
  console.log('===============================================\n');

  try {
    // Recopilar datos del usuario
    const nombre = await question('👤 Nombre completo: ');
    const email = await question('📧 Email: ');
    const password = await question('🔐 Contraseña: ');
    
    console.log('\n📋 Roles disponibles:');
    console.log('1. super_admin - Super Administrador (acceso total)');
    console.log('2. admin - Administrador (gestión completa)');
    console.log('3. contabilidad - Contabilidad (facturación, archivos, documentos)');
    console.log('4. tecnico - Técnico (dashboard, equipos, inventario - solo lectura)');
    
    const rolOption = await question('\n🎯 Selecciona rol (1-4): ');
    
    const roles = {
      '1': 'super_admin',
      '2': 'admin', 
      '3': 'contabilidad',
      '4': 'tecnico'
    };
    
    const rol = roles[rolOption];
    if (!rol) {
      console.log('❌ Opción de rol inválida');
      process.exit(1);
    }

    const activo = await question('✅ ¿Usuario activo? (s/n): ');
    const isActivo = activo.toLowerCase() === 's' || activo.toLowerCase() === 'si';

    // Confirmar datos
    console.log('\n📋 Resumen del usuario:');
    console.log(`Nombre: ${nombre}`);
    console.log(`Email: ${email}`);
    console.log(`Rol: ${rol}`);
    console.log(`Activo: ${isActivo ? 'Sí' : 'No'}`);
    
    const confirm = await question('\n✅ ¿Crear usuario? (s/n): ');
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'si') {
      console.log('❌ Operación cancelada');
      process.exit(0);
    }

    // Hash de la contraseña
    console.log('\n🔐 Generando hash de contraseña...');
    const passwordHash = await hashPassword(password);

    // Crear usuario en la base de datos
    console.log('💾 Creando usuario en la base de datos...');
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nombre: nombre,
        email: email,
        password_hash: passwordHash,
        rol: rol,
        activo: isActivo
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando usuario:', error.message);
      
      if (error.code === '23505') {
        console.log('💡 El email ya existe en el sistema');
      }
      
      process.exit(1);
    }

    console.log('\n✅ Usuario creado exitosamente!');
    console.log('📋 Datos del usuario:');
    console.log(`ID: ${data.id}`);
    console.log(`Nombre: ${data.nombre}`);
    console.log(`Email: ${data.email}`);
    console.log(`Rol: ${data.rol}`);
    console.log(`Activo: ${data.activo}`);
    console.log(`Creado: ${data.created_at}`);

    console.log('\n🔑 Credenciales de acceso:');
    console.log(`Email: ${email}`);
    console.log(`Contraseña: ${password}`);
    console.log('\n⚠️  IMPORTANTE: Guarda estas credenciales de forma segura');

  } catch (error) {
    console.error('❌ Error:', error.message);
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
createUser();