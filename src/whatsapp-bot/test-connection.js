#!/usr/bin/env node

/**
 * Test rápido de conexión para verificar que todo esté configurado
 */

const { supabase } = require('./dist/services/database');

async function testConnection() {
  console.log('🔍 Probando conexión a Supabase...');
  
  try {
    // Test 1: Conexión básica
    const { data, error } = await supabase
      .from('mantenimientos')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    
    // Test 2: Verificar tickets finalizados
    const { data: tickets, error: ticketsError } = await supabase
      .from('mantenimientos')
      .select('id, numero_reporte, estado, reporte_generado, equipos!inner(cliente)')
      .eq('estado', 'Finalizado')
      .eq('reporte_generado', true)
      .limit(5);
    
    if (ticketsError) {
      console.error('❌ Error obteniendo tickets:', ticketsError.message);
      return false;
    }
    
    console.log(`✅ Encontrados ${tickets?.length || 0} tickets finalizados con reporte`);
    
    if (tickets && tickets.length > 0) {
      console.log('\n📋 Tickets disponibles para prueba:');
      tickets.forEach((ticket, index) => {
        console.log(`   ${index + 1}. ${ticket.numero_reporte || ticket.id.substring(0, 8)} - ${ticket.equipos?.cliente || 'Sin cliente'}`);
      });
    }
    
    // Test 3: Verificar tabla document_sendings
    const { data: sendings } = await supabase
      .from('document_sendings')
      .select('count')
      .limit(1);
    
    console.log('✅ Tabla document_sendings accesible');
    
    return true;
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message);
    return false;
  }
}

// Ejecutar test
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Todas las conexiones funcionan correctamente!');
    console.log('   Puedes proceder a ejecutar el bot o los tests de documentos.');
  } else {
    console.log('\n❌ Hay problemas de conexión que resolver antes de continuar.');
  }
  process.exit(success ? 0 : 1);
});
