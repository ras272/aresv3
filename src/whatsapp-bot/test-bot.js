// Script de prueba para el bot de WhatsApp
const { MessageProcessor } = require('./dist/services/messageProcessor');

console.log('🧪 Testing ARES WhatsApp Bot Functions\n');

// Test 1: Detección de problemas
console.log('📋 Test 1: Detección de Problemas');
const testMessages = [
  'Tenemos un problema con el equipo de la Clínica San Roque',
  'URGENTE: El equipo del Hospital Central está parado',
  'Dr. Martinez reporta falla en el sistema',
  'Hola, ¿cómo están todos?', // No debería detectarse
  'El equipo no funciona correctamente, necesitamos ayuda'
];

testMessages.forEach((message, index) => {
  const result = MessageProcessor.processMessage(message, '+595981234567');
  console.log(`\nMensaje ${index + 1}: "${message}"`);
  console.log(`✅ Es solicitud: ${result.isServiceRequest}`);
  console.log(`🏢 Cliente: ${result.cliente || 'No detectado'}`);
  console.log(`⚠️ Prioridad: ${result.prioridad}`);
  console.log(`📝 Problema: ${result.problema?.substring(0, 50) || 'N/A'}...`);
});

// Test 2: Generación de respuestas
console.log('\n\n📱 Test 2: Generación de Respuestas');
const sampleTicket = {
  cliente: 'Clínica San Roque',
  problema: 'Equipo no funciona correctamente, pantalla en negro',
  prioridad: 'Alta',
  telefono: '+595981234567'
};

const groupResponse = MessageProcessor.generateGroupResponse('TKT-20250815-001', sampleTicket);
console.log('\n🔸 Respuesta para el grupo:');
console.log(groupResponse);

const javierNotification = MessageProcessor.generateJavierNotification('TKT-20250815-001', sampleTicket);
console.log('\n🔸 Notificación para Javier:');
console.log(javierNotification);

console.log('\n✅ Tests completados!');