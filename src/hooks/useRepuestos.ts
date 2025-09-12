import { useState, useEffect } from 'react';
import { 
  getRepuestos, 
  getRepuestoById, 
  createRepuesto, 
  updateRepuesto, 
  deleteRepuesto,
  searchRepuestos,
  getMovimientosRepuesto,
  asignarRepuestoAEquipo,
  getRepuestosPorEquipo
} from '@/lib/repuestos-database';
import { Repuesto, MovimientoRepuesto, RepuestoEquipo } from '@/types';
import { toast } from 'sonner';

export function useRepuestos() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRepuestos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRepuestos();
      setRepuestos(data);
    } catch (err) {
      console.error('Error al cargar repuestos:', err);
      setError('Error al cargar los repuestos');
      toast.error('Error al cargar los repuestos');
    } finally {
      setLoading(false);
    }
  };

  const loadRepuesto = async (id: string) => {
    try {
      const data = await getRepuestoById(id);
      return data;
    } catch (err) {
      console.error('Error al cargar repuesto:', err);
      toast.error('Error al cargar el repuesto');
      throw err;
    }
  };

  const createNewRepuesto = async (repuesto: Omit<Repuesto, 'id' | 'created_at' | 'updated_at' | 'codigo_repuesto'>) => {
    try {
      const data = await createRepuesto(repuesto);
      setRepuestos(prev => [...prev, data]);
      toast.success('Repuesto creado exitosamente');
      return data;
    } catch (err) {
      console.error('Error al crear repuesto:', err);
      toast.error('Error al crear el repuesto');
      throw err;
    }
  };

  const updateExistingRepuesto = async (id: string, updates: Partial<Repuesto>) => {
    try {
      const data = await updateRepuesto(id, updates);
      setRepuestos(prev => prev.map(repuesto => repuesto.id === id ? data : repuesto));
      toast.success('Repuesto actualizado exitosamente');
      return data;
    } catch (err) {
      console.error('Error al actualizar repuesto:', err);
      toast.error('Error al actualizar el repuesto');
      throw err;
    }
  };

  const deleteExistingRepuesto = async (id: string) => {
    try {
      await deleteRepuesto(id);
      setRepuestos(prev => prev.filter(repuesto => repuesto.id !== id));
      toast.success('Repuesto eliminado exitosamente');
    } catch (err) {
      console.error('Error al eliminar repuesto:', err);
      toast.error('Error al eliminar el repuesto');
      throw err;
    }
  };

  const searchRepuestosByName = async (term: string) => {
    try {
      const data = await searchRepuestos(term);
      return data;
    } catch (err) {
      console.error('Error al buscar repuestos:', err);
      toast.error('Error al buscar repuestos');
      throw err;
    }
  };

  const loadMovimientos = async (repuestoId: string) => {
    try {
      const data = await getMovimientosRepuesto(repuestoId);
      return data;
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
      toast.error('Error al cargar los movimientos');
      throw err;
    }
  };

  const assignRepuestoToEquipo = async (asignacion: Omit<RepuestoEquipo, 'id' | 'created_at' | 'fecha_uso'>) => {
    try {
      const data = await asignarRepuestoAEquipo(asignacion);
      // Actualizar el repuesto en la lista local
      setRepuestos(prev => prev.map(repuesto => 
        repuesto.id === asignacion.repuesto_id 
          ? { ...repuesto, cantidad_actual: data.repuesto.cantidad_actual } 
          : repuesto
      ));
      toast.success('Repuesto asignado exitosamente');
      return data;
    } catch (err) {
      console.error('Error al asignar repuesto:', err);
      toast.error('Error al asignar el repuesto');
      throw err;
    }
  };

  const loadRepuestosForEquipo = async (equipoId: string) => {
    try {
      const data = await getRepuestosPorEquipo(equipoId);
      return data;
    } catch (err) {
      console.error('Error al cargar repuestos del equipo:', err);
      toast.error('Error al cargar los repuestos del equipo');
      throw err;
    }
  };

  useEffect(() => {
    loadRepuestos();
  }, []);

  return {
    repuestos,
    loading,
    error,
    loadRepuestos,
    loadRepuesto,
    createNewRepuesto,
    updateExistingRepuesto,
    deleteExistingRepuesto,
    searchRepuestosByName,
    loadMovimientos,
    assignRepuestoToEquipo,
    loadRepuestosForEquipo,
  };
}