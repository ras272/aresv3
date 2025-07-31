// Test script para verificar las funciones híbridas
// Este script se puede ejecutar desde la consola del navegador

console.log('🧪 Iniciando prueba de funciones híbridas...');

// Simular datos de prueba
const testData = {
  itemId: 'da436e24-c31f-41d8-b00f-b2a3f3045de8',
  productoNombre: 'Filtros Rohs',
  productoMarca: 'Servicio Técnico',
  productoModelo: 'Filtros Rohs',
  cantidad: 2,
  cantidadAnterior: 13,
  mantenimientoId: '7a60e9a6-6f54-4def-be22-a39520b6efb5',
  equipoId: 'test-equipo-id',
  tecnicoResponsable: 'Test User',
  observaciones: 'Prueba de función híbrida'
};

console.log('📋 Datos de prueba:', testData);

// Instrucciones para ejecutar en la consola del navegador:
console.log(`
🔧 Para probar las funciones híbridas, ejecuta en la consola del navegador:

// 1. Importar el store
const { registrarSalidaStockReporte, devolverRepuestosAlStockReporte } = useAppStore.getState();

// 2. Probar salida de stock para reporte
await registrarSalidaStockReporte({
  itemId: '${testData.itemId}',
  productoNombre: '${testData.productoNombre}',
  productoMarca: '${testData.productoMarca}',
  productoModelo: '${testData.productoModelo}',
  cantidad: ${testData.cantidad},
  cantidadAnterior: ${testData.cantidadAnterior},
  mantenimientoId: '${testData.mantenimientoId}',
  equipoId: '${testData.equipoId}',
  tecnicoResponsable: '${testData.tecnicoResponsable}',
  observaciones: '${testData.observaciones}'
});

// 3. Verificar que se creó el movimiento
console.log('✅ Salida registrada. Verificar en la base de datos...');

// 4. Probar devolución
await devolverRepuestosAlStockReporte({
  itemId: '${testData.itemId}',
  productoNombre: '${testData.productoNombre}',
  productoMarca: '${testData.productoMarca}',
  productoModelo: '${testData.productoModelo}',
  cantidad: ${testData.cantidad},
  cantidadAnterior: ${testData.cantidadAnterior - testData.cantidad},
  mantenimientoId: '${testData.mantenimientoId}',
  equipoId: '${testData.equipoId}',
  tecnicoResponsable: '${testData.tecnicoResponsable}',
  observaciones: 'Devolución de prueba'
});

console.log('✅ Devolución registrada. Verificar en la base de datos...');
`);