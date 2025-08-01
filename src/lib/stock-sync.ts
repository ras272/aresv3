// 🎯 Sistema de sincronización de stock con trazabilidad
// Soluciona el problema de duplicados en remisiones

import { ComponenteDisponible } from '@/types';
import { 
  buscarProductoNormalizado, 
  generarClaveProducto, 
  sonMismoProducto 
} from './product-normalization';

export interface ProductoSincronizado {
  clave: string;
  nombre: string;
  marca: string;
  modelo: string;
  cantidadTotal: number;
  fuentes: {
    stock?: ComponenteDisponible;
    inventario?: ComponenteDisponible;
  };
}

/**
 * Sincroniza productos entre stock general e inventario técnico
 * Elimina duplicados y consolida cantidades
 */
export function sincronizarProductos(
  stockItems: ComponenteDisponible[],
  componentesDisponibles: ComponenteDisponible[]
): Map<string, ProductoSincronizado> {
  
  const productosConsolidados = new Map<string, ProductoSincronizado>();
  
  // Procesar stock general
  stockItems.forEach(item => {
    const clave = generarClaveProducto(item.nombre, item.marca, item.modelo);
    
    if (!productosConsolidados.has(clave)) {
      productosConsolidados.set(clave, {
        clave,
        nombre: item.nombre,
        marca: item.marca,
        modelo: item.modelo,
        cantidadTotal: item.cantidadDisponible,
        fuentes: { stock: item }
      });
    } else {
      const existing = productosConsolidados.get(clave)!;
      existing.cantidadTotal += item.cantidadDisponible;
      if (!existing.fuentes.stock) {
        existing.fuentes.stock = item;
      }
    }
  });
  
  // Procesar inventario técnico
  componentesDisponibles.forEach(comp => {
    const clave = generarClaveProducto(comp.nombre, comp.marca, comp.modelo);
    
    if (!productosConsolidados.has(clave)) {
      productosConsolidados.set(clave, {
        clave,
        nombre: comp.nombre,
        marca: comp.marca,
        modelo: comp.modelo,
        cantidadTotal: comp.cantidadDisponible,
        fuentes: { inventario: comp }
      });
    } else {
      const existing = productosConsolidados.get(clave)!;
      existing.cantidadTotal += comp.cantidadDisponible;
      if (!existing.fuentes.inventario) {
        existing.fuentes.inventario = comp;
      }
    }
  });
  
  return productosConsolidados;
}

/**
 * Busca un producto específico en el stock consolidado
 */
export function buscarProductoConsolidado(
  productosConsolidados: Map<string, ProductoSincronizado>,
  nombre: string,
  marca: string,
  modelo: string
): ProductoSincronizado | undefined {
  
  const clave = generarClaveProducto(nombre, marca, modelo);
  return productosConsolidados.get(clave);
}

/**
 * Obtiene productos únicos para mostrar en remisiones
 * Evita duplicados y muestra cantidad total disponible
 */
export function obtenerProductosUnicos(
  stockItems: ComponenteDisponible[],
  componentesDisponibles: ComponenteDisponible[]
): ComponenteDisponible[] {
  
  const productosConsolidados = sincronizarProductos(stockItems, componentesDisponibles);
  const productosUnicos: ComponenteDisponible[] = [];
  
  productosConsolidados.forEach(producto => {
    // Usar el producto del stock si existe, sino del inventario
    const productoBase = producto.fuentes.stock || producto.fuentes.inventario!;
    
    // Crear producto consolidado con cantidad total
    const productoUnico: ComponenteDisponible = {
      ...productoBase,
      cantidadDisponible: producto.cantidadTotal,
      // Marcar que es un producto consolidado
      observaciones: productoBase.observaciones ? 
        `${productoBase.observaciones} (Consolidado)` : 
        'Producto consolidado de múltiples fuentes'
    };
    
    productosUnicos.push(productoUnico);
  });
  
  return productosUnicos.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * Verifica si un producto existe en el stock (cualquier fuente)
 */
export function existeProductoEnStock(
  stockItems: ComponenteDisponible[],
  componentesDisponibles: ComponenteDisponible[],
  nombre: string,
  marca: string,
  modelo: string
): { existe: boolean; cantidadTotal: number; fuentes: string[] } {
  
  const productosConsolidados = sincronizarProductos(stockItems, componentesDisponibles);
  const producto = buscarProductoConsolidado(productosConsolidados, nombre, marca, modelo);
  
  if (!producto) {
    return { existe: false, cantidadTotal: 0, fuentes: [] };
  }
  
  const fuentes: string[] = [];
  if (producto.fuentes.stock) fuentes.push('Stock General');
  if (producto.fuentes.inventario) fuentes.push('Inventario Técnico');
  
  return {
    existe: true,
    cantidadTotal: producto.cantidadTotal,
    fuentes
  };
}

/**
 * Procesa la salida de stock de manera inteligente
 * Decide automáticamente de qué fuente sacar según disponibilidad
 */
export function procesarSalidaInteligente(
  stockItems: ComponenteDisponible[],
  componentesDisponibles: ComponenteDisponible[],
  nombre: string,
  marca: string,
  modelo: string,
  cantidadSolicitada: number
): {
  esValida: boolean;
  mensaje: string;
  operaciones: Array<{
    tipo: 'stock' | 'inventario';
    itemId: string;
    cantidadASacar: number;
  }>;
} {
  
  const productosConsolidados = sincronizarProductos(stockItems, componentesDisponibles);
  const producto = buscarProductoConsolidado(productosConsolidados, nombre, marca, modelo);
  
  if (!producto) {
    return {
      esValida: false,
      mensaje: 'Producto no encontrado en stock',
      operaciones: []
    };
  }
  
  if (producto.cantidadTotal < cantidadSolicitada) {
    return {
      esValida: false,
      mensaje: `Stock insuficiente. Disponible: ${producto.cantidadTotal}, Solicitado: ${cantidadSolicitada}`,
      operaciones: []
    };
  }
  
  const operaciones: Array<{
    tipo: 'stock' | 'inventario';
    itemId: string;
    cantidadASacar: number;
  }> = [];
  
  let cantidadRestante = cantidadSolicitada;
  
  // Priorizar stock general primero
  if (producto.fuentes.stock && cantidadRestante > 0) {
    const cantidadDisponibleStock = producto.fuentes.stock.cantidadDisponible;
    const cantidadASacar = Math.min(cantidadRestante, cantidadDisponibleStock);
    
    if (cantidadASacar > 0) {
      operaciones.push({
        tipo: 'stock',
        itemId: producto.fuentes.stock.id,
        cantidadASacar
      });
      cantidadRestante -= cantidadASacar;
    }
  }
  
  // Si queda cantidad, usar inventario técnico
  if (producto.fuentes.inventario && cantidadRestante > 0) {
    const cantidadDisponibleInventario = producto.fuentes.inventario.cantidadDisponible;
    const cantidadASacar = Math.min(cantidadRestante, cantidadDisponibleInventario);
    
    if (cantidadASacar > 0) {
      operaciones.push({
        tipo: 'inventario',
        itemId: producto.fuentes.inventario.id,
        cantidadASacar
      });
      cantidadRestante -= cantidadASacar;
    }
  }
  
  return {
    esValida: cantidadRestante === 0,
    mensaje: cantidadRestante === 0 ? 
      'Operación válida' : 
      `No se pudo completar la operación. Faltante: ${cantidadRestante}`,
    operaciones
  };
}

// 🎯 EJEMPLO DE USO:
// 
// const stockItems = [...]; // Del store
// const componentesDisponibles = [...]; // Del store
// 
// // Obtener productos únicos para mostrar en remisiones
// const productosUnicos = obtenerProductosUnicos(stockItems, componentesDisponibles);
// 
// // Verificar si existe un producto
// const existe = existeProductoEnStock(stockItems, componentesDisponibles, "Kit Hydrafacial", "Hydrafacial", "ND-ELITE");
// 
// // Procesar salida inteligente
// const resultado = procesarSalidaInteligente(stockItems, componentesDisponibles, "Kit Hydrafacial", "Hydrafacial", "ND-ELITE", 2);