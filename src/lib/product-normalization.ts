// 🎯 Sistema de normalización de productos para trazabilidad
// Asegura que productos con el mismo nombre se reconozcan como iguales

export interface ProductoNormalizado {
  nombre: string;
  marca: string;
  modelo: string;
  claveUnica: string; // Clave única para identificar el producto
}

/**
 * Normaliza el nombre de un producto para crear una clave única
 */
export function normalizarNombreProducto(nombre: string): string {
  return nombre
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
    .trim();
}

/**
 * Normaliza la marca de un producto
 */
export function normalizarMarca(marca: string): string {
  return marca
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Normaliza el modelo de un producto
 */
export function normalizarModelo(modelo: string): string {
  return modelo
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s\-]/g, '')
    .trim();
}

/**
 * Genera una clave única para un producto basada en nombre, marca y modelo
 */
export function generarClaveProducto(nombre: string, marca: string, modelo: string): string {
  const nombreNorm = normalizarNombreProducto(nombre);
  const marcaNorm = normalizarMarca(marca);
  const modeloNorm = normalizarModelo(modelo);
  
  return `${nombreNorm}|${marcaNorm}|${modeloNorm}`;
}

/**
 * Normaliza un producto completo
 */
export function normalizarProducto(nombre: string, marca: string, modelo: string): ProductoNormalizado {
  const nombreNorm = normalizarNombreProducto(nombre);
  const marcaNorm = normalizarMarca(marca);
  const modeloNorm = normalizarModelo(modelo);
  const claveUnica = generarClaveProducto(nombre, marca, modelo);
  
  return {
    nombre: nombreNorm,
    marca: marcaNorm,
    modelo: modeloNorm,
    claveUnica
  };
}

/**
 * Verifica si dos productos son el mismo basándose en su clave única
 */
export function sonMismoProducto(
  producto1: { nombre: string; marca: string; modelo: string },
  producto2: { nombre: string; marca: string; modelo: string }
): boolean {
  const clave1 = generarClaveProducto(producto1.nombre, producto1.marca, producto1.modelo);
  const clave2 = generarClaveProducto(producto2.nombre, producto2.marca, producto2.modelo);
  
  return clave1 === clave2;
}

/**
 * Busca un producto en una lista usando normalización
 */
export function buscarProductoNormalizado<T extends { nombre: string; marca: string; modelo: string }>(
  productos: T[],
  nombreBuscado: string,
  marcaBuscada: string,
  modeloBuscado: string
): T | undefined {
  const claveBuscada = generarClaveProducto(nombreBuscado, marcaBuscada, modeloBuscado);
  
  return productos.find(producto => {
    const claveProducto = generarClaveProducto(producto.nombre, producto.marca, producto.modelo);
    return claveProducto === claveBuscada;
  });
}

/**
 * Agrupa productos similares en una lista
 */
export function agruparProductosSimilares<T extends { nombre: string; marca: string; modelo: string }>(
  productos: T[]
): Map<string, T[]> {
  const grupos = new Map<string, T[]>();
  
  productos.forEach(producto => {
    const clave = generarClaveProducto(producto.nombre, producto.marca, producto.modelo);
    
    if (!grupos.has(clave)) {
      grupos.set(clave, []);
    }
    
    grupos.get(clave)!.push(producto);
  });
  
  return grupos;
}

// 🎯 EJEMPLOS DE USO:
// 
// const producto1 = { nombre: "Kit Hydrafacial", marca: "Hydrafacial", modelo: "ND-ELITE" };
// const producto2 = { nombre: "kit hydrafacial", marca: "HYDRAFACIAL", modelo: "nd-elite" };
// 
// console.log(sonMismoProducto(producto1, producto2)); // true
// 
// const clave = generarClaveProducto("Kit Hydrafacial", "Hydrafacial", "ND-ELITE");
// console.log(clave); // "kit hydrafacial|hydrafacial|nd-elite"