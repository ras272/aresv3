// Script para verificar las exportaciones de los módulos de base de datos
const fs = require('fs');
const path = require('path');

// Función para extraer exportaciones de un archivo
function extractExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const exports = [];
    
    // Buscar exportaciones de funciones
    const exportRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Buscar exportaciones const
    const constExportRegex = /export\s+const\s+(\w+)/g;
    while ((match = constExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

// Verificar cada módulo
const modules = [
  'mercaderias.ts',
  'stock.ts', 
  'equipos.ts',
  'mantenimientos.ts',
  'clinicas.ts',
  'remisiones.ts',
  'usuarios.ts'
];

console.log('=== VERIFICACIÓN DE EXPORTACIONES ===\n');

modules.forEach(module => {
  const filePath = path.join(__dirname, 'src', 'lib', 'database', module);
  const exports = extractExports(filePath);
  
  console.log(`📁 ${module}:`);
  if (exports.length > 0) {
    exports.forEach(exp => console.log(`  ✅ ${exp}`));
  } else {
    console.log('  ❌ No se encontraron exportaciones');
  }
  console.log('');
});

// Verificar el archivo index.ts
console.log('=== VERIFICACIÓN DEL ARCHIVO INDEX.TS ===\n');
const indexPath = path.join(__dirname, 'src', 'lib', 'database', 'index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Extraer las funciones que se están intentando exportar desde cada módulo
const moduleExportRegex = /export\s*{\s*([^}]+)\s*}\s*from\s*['"]\.\/(\w+)['"]/g;
let match;

while ((match = moduleExportRegex.exec(indexContent)) !== null) {
  const functions = match[1].split(',').map(f => f.trim());
  const moduleName = match[2];
  
  console.log(`📁 Exportaciones desde ${moduleName}.ts:`);
  functions.forEach(func => {
    console.log(`  📤 ${func}`);
  });
  console.log('');
}