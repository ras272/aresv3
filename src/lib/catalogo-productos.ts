import { supabase } from './supabase';

export interface ProductoCatalogo {
  id: string;
  marca: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Obtener todos los productos del catálogo
export async function getAllProductosCatalogo(): Promise<ProductoCatalogo[]> {
  try {
    const { data, error } = await supabase
      .from('catalogo_productos')
      .select('*')
      .eq('activo', true)
      .order('marca', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo productos del catálogo:', error);
    throw error;
  }
}

// Obtener productos por marca
export async function getProductosByMarca(marca: string): Promise<ProductoCatalogo[]> {
  try {
    const { data, error } = await supabase
      .from('catalogo_productos')
      .select('*')
      .eq('marca', marca)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo productos por marca:', error);
    throw error;
  }
}

// Obtener todas las marcas disponibles
export async function getMarcasDisponibles(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('catalogo_productos')
      .select('marca')
      .eq('activo', true)
      .order('marca', { ascending: true });

    if (error) throw error;
    
    // Obtener marcas únicas
    const marcasUnicas = [...new Set(data?.map(item => item.marca) || [])];
    return marcasUnicas;
  } catch (error) {
    console.error('Error obteniendo marcas:', error);
    throw error;
  }
}

// Crear nuevo producto
export async function createProductoCatalogo(producto: {
  marca: string;
  nombre: string;
  descripcion?: string;
}): Promise<ProductoCatalogo> {
  try {
    const { data, error } = await supabase
      .from('catalogo_productos')
      .insert({
        marca: producto.marca.trim(),
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion?.trim() || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creando producto:', error);
    throw error;
  }
}

// Actualizar producto
export async function updateProductoCatalogo(
  id: string, 
  updates: {
    marca?: string;
    nombre?: string;
    descripcion?: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('catalogo_productos')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error actualizando producto:', error);
    throw error;
  }
}

// Eliminar producto (soft delete)
export async function deleteProductoCatalogo(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('catalogo_productos')
      .update({ 
        activo: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error eliminando producto:', error);
    throw error;
  }
}

// Buscar productos
export async function searchProductos(query: string): Promise<ProductoCatalogo[]> {
  try {
    const { data, error } = await supabase
      .from('catalogo_productos')
      .select('*')
      .eq('activo', true)
      .or(`marca.ilike.%${query}%,nombre.ilike.%${query}%,descripcion.ilike.%${query}%`)
      .order('marca', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error buscando productos:', error);
    throw error;
  }
}