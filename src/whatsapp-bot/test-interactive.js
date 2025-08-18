// Test interactivo del bot ARES
const readline = require('readline');
const { MessageProcessor } = require('./dist/services/messageProcessor');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 ARES WhatsApp Bot - Test Interactivo');
console.log('=' .repeat(50));
console.log('Escribe mensajes como si fueras un usuario del grupo ServTec');
console.log('El bot analizará y responderá como lo haría en WhatsApp');
console.log('Escribe "salir" para terminar\n');

console.log('💡 Ejemplos para probar:');
console.log('- "URGENTE: Hydrafacial no funciona en Ares Paraguay"');
console.log('- "Problema con equipo de la Clínica San Roque"');
console.log('- "Importante: Dr. Martinez necesita ayuda pronto"');
console.log('- "Consulta sobre mantenimiento cuando puedas"\n');

function processUserMessage(message) {
  if (message.toLowerCase() === 'salir') {
    console.log('\n👋 ¡Gracias por probar el bot ARES!');
    rl.close();
    return;
  }

  console.log('\n🔍 Analizando mensaje...');
  
  const result = MessageProcessor.processMessage(message, '+595981234567');
  
  if (!result.isServiceRequest) {
    console.log('❌ No se detectó como solicitud de servicio');
    console.log('💡 Intenta usar palabras como: problema, falla, urgente, ayuda, etc.\n');
    askForMessage();
    return;
  }

  // Simular creación de ticket
  const ticketId = 'test-' + Math.random().toString(36).substr(2, 9);
  const ticketNumber = MessageProcessor.generateTicketNumber(ticketId);
  
  console.log('✅ ¡Solicitud de servicio detectada!');
  console.log('📊 Análisis:');
  console.log(`   🏢 Cliente: ${result.cliente || 'Por definir'}`);
  console.log(`   🔧 Equipo: ${result.equipoInfo || 'Por definir'}`);
  console.log(`   ⚠️ Prioridad: ${result.prioridad}`);
  console.log(`   📱 Teléfono: ${result.telefono || 'Desde grupo'}`);
  
  console.log('\n📱 Respuesta en el grupo:');
  console.log('-'.repeat(40));
  const groupResponse = MessageProcessor.generateGroupResponse(ticketId, result, result.equipoInfo);
  console.log(groupResponse);
  
  console.log('\n📞 Notificación privada a Javier:');
  console.log('-'.repeat(40));
  const javierNotification = MessageProcessor.generateJavierNotification(ticketId, result, result.equipoInfo);
  console.log(javierNotification);
  
  // Mostrar comandos disponibles para Javier
  console.log('\n🔧 Comandos que Javier puede usar:');
  console.log(`   ✅ "Listo ${ticketNumber}" - Marcar completado`);
  console.log(`   🔧 "Proceso ${ticketNumber}" - En proceso`);
  console.log(`   ⏸️ "Repuesto ${ticketNumber}" - Esperando repuestos`);
  console.log(`   ❌ "Problema ${ticketNumber} [motivo]" - Reportar problema`);
  
  // Mostrar lógica de recordatorios
  console.log('\n⏰ Recordatorios programados:');
  if (result.prioridad === 'Crítica') {
    console.log('   🚨 Cada 2 horas (crítico)');
  } else {
    console.log('   📋 Cada 4 horas (normal)');
  }
  
  console.log('\n' + '='.repeat(50));
  askForMessage();
}

function askForMessage() {
  rl.question('💬 Escribe tu mensaje: ', processUserMessage);
}

// Iniciar el test interactivo
askForMessage();