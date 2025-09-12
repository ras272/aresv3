import { supabase } from '@/lib/database/shared/supabase';
import { Repuesto, MovimientoRepuesto, RepuestoEquipo } from '@/types';

// Usar el cliente de Supabase ya creado
const supabaseClient = supabase;

// ===============================================
// SERVICIOS PARA EL SISTEMA DE REPUESTOS
// ===============================================

/**
 * Obtener todos los repuestos
 */
export async function getRepuestos() {
  const { data, error } = await supabaseClient
    .from('repuestos_stock')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  if (error) throw error;
  return data as Repuesto[];
}

/**
 * Obtener un repuesto por ID
 */
export async function getRepuestoById(id: string) {
  const { data, error } = await supabaseClient
    .from('repuestos_stock')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Repuesto;
}

/**
 * Crear un nuevo repuesto
 */
export async function createRepuesto(repuesto: Omit<Repuesto, 'id' | 'created_at' | 'updated_at' | 'codigo_repuesto'>) {
  // Generar código único para el repuesto
  const { data: codigoData, error: codigoError } = await supabaseClient.rpc('generar_codigo_repuesto');
  if (codigoError) throw codigoError;

  const nuevoRepuesto = {
    ...repuesto,
    codigo_repuesto: codigoData as string
  };

  const { data, error } = await supabaseClient
    .from('repuestos_stock')
    .insert(nuevoRepuesto)
    .select()
    .single();

  if (error) throw error;
  return data as Repuesto;
}

/**
 * Actualizar un repuesto
 */
export async function updateRepuesto(id: string, updates: Partial<Repuesto>) {
  const { data, error } = await supabaseClient
    .from('repuestos_stock')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Repuesto;
}

/**
 * Eliminar un repuesto (soft delete)
 */
export async function deleteRepuesto(id: string) {
  const { data, error } = await supabaseClient
    .from('repuestos_stock')
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Repuesto;
}

/**
 * Obtener movimientos de un repuesto
 */
export async function getMovimientosRepuesto(repuestoId: string) {
  const { data, error } = await supabaseClient
    .from('movimientos_repuestos')
    .select('*')
    .eq('repuesto_id', repuestoId)
    .order('fecha_movimiento', { ascending: false });

  if (error) throw error;
  return data as MovimientoRepuesto[];
}

/**
 * Registrar un movimiento de repuesto
 */
export async function createMovimientoRepuesto(movimiento: Omit<MovimientoRepuesto, 'id' | 'created_at'>) {
  const { data, error } = await supabaseClient
    .from('movimientos_repuestos')
    .insert(movimiento)
    .select()
    .single();

  if (error) throw error;
  return data as MovimientoRepuesto;
}

/**
 * Asignar repuesto a un equipo
 */
export async function asignarRepuestoAEquipo(asignacion: Omit<RepuestoEquipo, 'id' | 'created_at' | 'fecha_uso'>) {
  // Primero registrar la asignación
  const { data: asignacionData, error: asignacionError } = await supabaseClient
    .from('repuestos_equipos')
    .insert({
      ...asignacion,
      fecha_uso: new Date().toISOString()
    })
    .select()
    .single();

  if (asignacionError) throw asignacionError;

  // Luego actualizar la cantidad en stock
  const { data: repuestoData, error: repuestoError } = await supabaseClient
    .from('repuestos_stock')
    .select('cantidad_actual')
    .eq('id', asignacion.repuesto_id)
    .single();

  if (repuestoError) throw repuestoError;

  const nuevaCantidad = repuestoData.cantidad_actual - asignacion.cantidad_usada;

  const { data: updateData, error: updateError } = await supabaseClient
    .from('repuestos_stock')
    .update({ cantidad_actual: nuevaCantidad })
    .eq('id', asignacion.repuesto_id)
    .select()
    .single();

  if (updateError) throw updateError;

  return {
    asignacion: asignacionData as RepuestoEquipo,
    repuesto: updateData as Repuesto
  };
}

/**
 * Obtener repuestos asignados a un equipo
 */
export async function getRepuestosPorEquipo(equipoId: string) {
  const { data, error } = await supabaseClient
    .from('vista_repuestos_por_equipo')
    .select('*')
    .eq('equipo_id', equipoId)
    .order('fecha_uso', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Obtener movimientos recientes de repuestos
 */
export async function getMovimientosRecientes() {
  const { data, error } = await supabaseClient
    .from('vista_movimientos_repuestos_recientes')
    .select('*')
    .limit(10)
    .order('fecha_movimiento', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Buscar repuestos por término de búsqueda
 */
export async function searchRepuestos(termino: string) {
  const { data, error } = await supabaseClient
    .from('repuestos_stock')
    .select('*')
    .eq('activo', true)
    .or(`nombre.ilike.%${termino}%,codigo_repuesto.ilike.%${termino}%,marca.ilike.%${termino}%`)
    .order('nombre');

  if (error) throw error;
  return data as Repuesto[];
}

/**
 * Obtener repuestos por categoría
 */
export async function getRepuestosPorCategoria(categoria: string) {
  const { data, error } = await supabaseClient
    .from('repuestos_stock')
    .select('*')
    .eq('activo', true)
    .eq('categoria', categoria)
    .order('nombre');

  if (error) throw error;
  return data as Repuesto[];
}

/**
 * Obtener repuestos por marca
 */
export async function getRepuestosByMarca(marca: string) {
  const { data, error } = await supabaseClient
    .from('repuestos_stock')
    .select('*')
    .eq('activo', true)
    .eq('marca', marca)
    .order('nombre');

  if (error) throw error;
  return data as Repuesto[];
}

/**
 * Obtener categorías de repuestos
 */
export async function getCategoriasRepuestos() {
  const { data, error } = await supabaseClient
    .from('repuestos_stock')
    .select('categoria')
    .eq('activo', true)
    .not('categoria', 'is', null)
    .order('categoria');

  if (error) throw error;
  
  // Extraer categorías únicas
  const categorias = [...new Set(data.map(item => item.categoria))] as string[];
  return categorias;
}