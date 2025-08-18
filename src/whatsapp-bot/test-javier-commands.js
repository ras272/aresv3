// Test de comandos de Javier
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('👨‍🔧 Test de Comandos de Javier');
console.log('=' .repeat(50));
console.log('Simula los comandos que Javier puede enviar por WhatsApp privado');
console.log('Escribe "salir" para terminar\n');

console.log('📋 Comandos disponibles:');
console.log('✅ "Listo TKT-1234" - Marcar ticket como completado');
console.log('🔧 "Proceso TKT-1234" - Cambiar a "En proceso"');
console.log('⏸️ "Repuesto TKT-1234" - Pausar (esperando repuestos)');
console.log('❌ "Problema TKT-1234 falta pieza X" - Reportar problema');
console.log('📊 "Estado" - Ver resumen de tickets pendientes\n');

// Simular algunos tickets existentes
const mockTickets = {
  'TKT-1234': { cliente: 'Ares Paraguay', equipo: 'Hydrafacial', prioridad: 'Crítica', estado: 'Pendiente' },
  'TKT-5678': { cliente: 'Clínica Norte', equipo: 'HIFU', prioridad: 'Alta', estado: 'En proceso' },
  'TKT-9012': { cliente: 'Hospital Central', equipo: 'Láser', prioridad: 'Media', estado: 'Pendiente' }
};

function processJavierCommand(command) {
  if (command.toLowerCase() === 'salir') {
    console.log('\n👋 ¡Gracias por probar los comandos!');
    rl.close();
    return;
  }

  console.log(`\n🔍 Procesando comando: "${command}"`);
  
  const lowerCmd = command.toLowerCase().trim();
  
  // Detectar tipo de comando
  if (/^listo\s+(tkt-\d+)/i.test(lowerCmd)) {
    const match = lowerCmd.match(/^listo\s+(tkt-\d+)/i);
    const ticketNumber = match[1].toUpperCase();
    
    if (mockTickets[ticketNumber]) {
      console.log('✅ Comando reconocido: Marcar como completado');
      console.log(`📋 Ticket ${ticketNumber}: ${mockTickets[ticketNumber].cliente} - ${mockTickets[ticketNumber].equipo}`);
      console.log('🔄 Acción: Estado cambiado a "Finalizado"');
      console.log('📱 Respuesta a Javier: "✅ Ticket ' + ticketNumber + ' marcado como completado"');
      console.log('📢 Mensaje al grupo: "✅ Ticket ' + ticketNumber + ' completado por Javier Lopez"');
    } else {
      console.log('❌ Ticket no encontrado');
      console.log('📱 Respuesta a Javier: "❌ No encontré el ticket ' + ticketNumber + '"');
    }
    
  } else if (/^proceso\s+(tkt-\d+)/i.test(lowerCmd)) {
    const match = lowerCmd.match(/^proceso\s+(tkt-\d+)/i);
    const ticketNumber = match[1].toUpperCase();
    
    if (mockTickets[ticketNumber]) {
      console.log('🔧 Comando reconocido: Cambiar a "En proceso"');
      console.log(`📋 Ticket ${ticketNumber}: ${mockTickets[ticketNumber].cliente} - ${mockTickets[ticketNumber].equipo}`);
      console.log('🔄 Acción: Estado cambiado a "En proceso"');
      console.log('📱 Respuesta a Javier: "🔧 Ticket ' + ticketNumber + ' marcado como \\"En proceso\\""');
    } else {
      console.log('❌ Ticket no encontrado');
    }
    
  } else if (/^repuesto\s+(tkt-\d+)/i.test(lowerCmd)) {
    const match = lowerCmd.match(/^repuesto\s+(tkt-\d+)/i);
    const ticketNumber = match[1].toUpperCase();
    
    if (mockTickets[ticketNumber]) {
      console.log('⏸️ Comando reconocido: Esperando repuestos');
      console.log(`📋 Ticket ${ticketNumber}: ${mockTickets[ticketNumber].cliente} - ${mockTickets[ticketNumber].equipo}`);
      console.log('🔄 Acción: Estado cambiado a "Esperando repuestos"');
      console.log('📱 Respuesta a Javier: "⏸️ Ticket ' + ticketNumber + ' pausado - esperando repuestos. No recibirás más recordatorios hasta que cambies el estado."');
      console.log('⏰ Recordatorios: PAUSADOS hasta cambio de estado');
    } else {
      console.log('❌ Ticket no encontrado');
    }
    
  } else if (/^problema\s+(tkt-\d+)\s*(.*)$/i.test(lowerCmd)) {
    const match = lowerCmd.match(/^problema\s+(tkt-\d+)\s*(.*)$/i);
    const ticketNumber = match[1].toUpperCase();
    const details = match[2] || 'Sin detalles';
    
    if (mockTickets[ticketNumber]) {
      console.log('❌ Comando reconocido: Reportar problema');
      console.log(`📋 Ticket ${ticketNumber}: ${mockTickets[ticketNumber].cliente} - ${mockTickets[ticketNumber].equipo}`);
      console.log(`📝 Detalles: ${details}`);
      console.log('🔄 Acción: Problema reportado a gerencia');
      console.log('📱 Respuesta a Javier: "❌ Ticket ' + ticketNumber + ' marcado con problema. Gerencia será notificada."');
      console.log('📢 Mensaje a Jefa: "🚨 PROBLEMA con ticket ' + ticketNumber + '\\n\\nJavier reporta: ' + details + '\\n\\nRequiere atención de gerencia."');
    } else {
      console.log('❌ Ticket no encontrado');
    }
    
  } else if (/^estado$/i.test(lowerCmd)) {
    console.log('📊 Comando reconocido: Consultar estado');
    console.log('🔄 Acción: Mostrar resumen de tickets');
    
    const pendientes = Object.values(mockTickets).filter(t => t.estado === 'Pendiente').length;
    const enProceso = Object.values(mockTickets).filter(t => t.estado === 'En proceso').length;
    const criticos = Object.values(mockTickets).filter(t => t.prioridad === 'Crítica' && t.estado !== 'Finalizado').length;
    
    console.log('📱 Respuesta a Javier:');
    console.log(`📊 Tu estado actual:

⏳ Pendientes: ${pendientes}
🔧 En proceso: ${enProceso}
⏸️ Esperando repuestos: 0
🚨 Críticos: ${criticos}

${criticos > 0 ? '⚡ Hay tickets críticos que requieren atención' : '✅ Todo bajo control'}`);
    
  } else {
    console.log('❓ Comando no reconocido');
    console.log('💡 Comandos válidos:');
    console.log('   - "Listo TKT-XXXX"');
    console.log('   - "Proceso TKT-XXXX"');
    console.log('   - "Repuesto TKT-XXXX"');
    console.log('   - "Problema TKT-XXXX [detalles]"');
    console.log('   - "Estado"');
  }
  
  console.log('\n' + '='.repeat(50));
  askForCommand();
}

function askForCommand() {
  rl.question('👨‍🔧 Comando de Javier: ', processJavierCommand);
}

// Mostrar tickets disponibles para testing
console.log('🎫 Tickets disponibles para testing:');
Object.entries(mockTickets).forEach(([id, ticket]) => {
  console.log(`   ${id}: ${ticket.cliente} - ${ticket.equipo} (${ticket.prioridad}, ${ticket.estado})`);
});
console.log('');

// Iniciar el test
askForCommand();