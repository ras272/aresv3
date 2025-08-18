// Monitor en tiempo real del bot ARES
const fs = require('fs');
const path = require('path');

console.log('📊 ARES WhatsApp Bot - Monitor en Tiempo Real');
console.log('=' .repeat(60));

let lastLogSize = 0;
const logFile = path.join(__dirname, 'logs', 'combined.log');

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('es-PY', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatLogEntry(logEntry) {
  try {
    const log = JSON.parse(logEntry);
    const time = formatTimestamp(log.timestamp);
    const level = log.level.toUpperCase();
    
    let icon = '📝';
    switch (level) {
      case 'ERROR': icon = '❌'; break;
      case 'WARN': icon = '⚠️'; break;
      case 'INFO': icon = '✅'; break;
      case 'DEBUG': icon = '🔍'; break;
    }
    
    let message = `${icon} [${time}] ${log.message}`;
    
    // Agregar contexto específico según el tipo de mensaje
    if (log.message.includes('Service request detected')) {
      message += `\n   🏢 Cliente: ${log.cliente || 'N/A'}`;
      message += `\n   🔧 Equipo: ${log.equipoInfo || 'N/A'}`;
      message += `\n   ⚠️ Prioridad: ${log.prioridad}`;
    } else if (log.message.includes('Ticket created successfully')) {
      message += `\n   🎫 ID: ${log.ticketId}`;
    } else if (log.message.includes('Equipment found automatically')) {
      message += `\n   🔍 Equipo encontrado: ${log.equipoInfo}`;
    } else if (log.message.includes('Message sent')) {
      message += `\n   📱 Enviado correctamente`;
    }
    
    return message;
  } catch (error) {
    return `📝 ${logEntry}`;
  }
}

function showSystemStats() {
  console.log('\n📊 Estadísticas del Sistema:');
  console.log('-'.repeat(40));
  
  // Verificar si el bot está corriendo
  const { execSync } = require('child_process');
  try {
    const processes = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
    const nodeProcesses = processes.split('\n').filter(line => line.includes('node.exe')).length - 1;
    console.log(`🤖 Procesos Node.js: ${nodeProcesses}`);
  } catch (error) {
    console.log('🤖 Estado del bot: No se pudo verificar');
  }
  
  // Estadísticas de logs
  if (fs.existsSync(logFile)) {
    const stats = fs.statSync(logFile);
    console.log(`📁 Tamaño de logs: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`📅 Última modificación: ${formatTimestamp(stats.mtime)}`);
    
    // Contar tipos de logs
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      const errors = lines.filter(line => line.includes('"level":"error"')).length;
      const warnings = lines.filter(line => line.includes('"level":"warn"')).length;
      const infos = lines.filter(line => line.includes('"level":"info"')).length;
      
      console.log(`❌ Errores: ${errors}`);
      console.log(`⚠️ Advertencias: ${warnings}`);
      console.log(`✅ Info: ${infos}`);
      console.log(`📝 Total logs: ${lines.length}`);
    } catch (error) {
      console.log('📊 No se pudieron leer estadísticas de logs');
    }
  } else {
    console.log('📁 Archivo de logs no encontrado');
  }
  
  console.log('-'.repeat(40));
}

function watchLogs() {
  if (!fs.existsSync(logFile)) {
    console.log('⏳ Esperando que se cree el archivo de logs...');
    setTimeout(watchLogs, 2000);
    return;
  }
  
  const stats = fs.statSync(logFile);
  
  if (stats.size > lastLogSize) {
    const stream = fs.createReadStream(logFile, {
      start: lastLogSize,
      encoding: 'utf8'
    });
    
    let buffer = '';
    
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Guardar línea incompleta
      
      lines.forEach(line => {
        if (line.trim()) {
          console.log(formatLogEntry(line.trim()));
        }
      });
    });
    
    stream.on('end', () => {
      if (buffer.trim()) {
        console.log(formatLogEntry(buffer.trim()));
      }
    });
    
    lastLogSize = stats.size;
  }
  
  setTimeout(watchLogs, 1000); // Verificar cada segundo
}

function showInstructions() {
  console.log('📋 Instrucciones de Monitoreo:');
  console.log('1. 🚀 Asegúrate de que el bot esté ejecutándose en otra terminal');
  console.log('2. 📱 Envía mensajes al grupo ServTec para ver la actividad');
  console.log('3. 👀 Observa los logs en tiempo real aquí');
  console.log('4. 📊 Las estadísticas se actualizan automáticamente');
  console.log('5. ⌨️ Presiona Ctrl+C para salir del monitor\n');
}

// Manejar cierre del monitor
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitor detenido. ¡Gracias por usar ARES Bot!');
  process.exit(0);
});

// Mostrar estadísticas iniciales
showInstructions();
showSystemStats();

console.log('\n🔄 Iniciando monitoreo en tiempo real...');
console.log('📝 Logs aparecerán aquí cuando el bot esté activo:\n');

// Iniciar monitoreo
watchLogs();

// Actualizar estadísticas cada 30 segundos
setInterval(() => {
  console.log('\n' + '='.repeat(60));
  showSystemStats();
  console.log('🔄 Continuando monitoreo...\n');
}, 30000);