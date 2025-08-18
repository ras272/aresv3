// Test de prioridades del bot
const { MessageProcessor } = require('./dist/services/messageProcessor');

console.log('🧪 Testing Priority Detection\n');

const testCases = [
  // Crítica
  { msg: 'URGENTE: Hydrafacial no funciona', expected: 'Crítica' },
  { msg: 'Problema crítico con equipo parado', expected: 'Crítica' },
  { msg: 'ERROR GRAVE - necesito ayuda YA', expected: 'Crítica' },
  
  // Alta
  { msg: 'Importante: necesito que vengas pronto', expected: 'Alta' },
  { msg: 'Favor revisar equipo rápido', expected: 'Alta' },
  { msg: 'Requiere atención, problema con múltiples equipos que están fallando', expected: 'Alta' },
  
  // Media
  { msg: 'Problema con el Hydrafacial de Ares Paraguay', expected: 'Media' },
  { msg: 'Tenemos una falla en el sistema', expected: 'Media' },
  
  // Baja
  { msg: 'Consulta sobre mantenimiento cuando puedas', expected: 'Baja' },
  { msg: 'Pregunta sin apuro sobre el equipo', expected: 'Baja' }
];

testCases.forEach((test, index) => {
  const result = MessageProcessor.processMessage(test.msg, '+595123456789');
  const success = result.prioridad === test.expected ? '✅' : '❌';
  
  console.log(`${success} Test ${index + 1}:`);
  console.log(`   Mensaje: "${test.msg}"`);
  console.log(`   Esperado: ${test.expected} | Obtenido: ${result.prioridad}`);
  console.log(`   Cliente: ${result.cliente || 'No detectado'}`);
  console.log(`   Equipo: ${result.equipoInfo || 'No detectado'}`);
  console.log('');
});

console.log('🎯 Resumen de valores válidos en BD:');
console.log('   Prioridad: Baja, Media, Alta, Crítica');
console.log('   Estado: Pendiente, En proceso, Esperando repuestos, Finalizado');