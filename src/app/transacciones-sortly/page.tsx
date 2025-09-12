'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/database/shared/supabase';
import { toast } from 'sonner';
import { FormularioTransaccion } from '@/components/transacciones-sortly/FormularioTransaccion';
import { TablaTransacciones } from '@/components/transacciones-sortly/TablaTransacciones';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface TransaccionSortly {
  id: string;
  fecha_transaccion: string;
  factura_os: string | null;
  remision: string | null;
  producto_descripcion: string;
  cantidad: number;
  cliente_destino: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export default function TransaccionesSortlyPage() {
  const { user } = useAuth();
  const [transacciones, setTransacciones] = useState<TransaccionSortly[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [transaccionEditando, setTransaccionEditando] = useState<TransaccionSortly | null>(null);

  const tiposFiltro = [
    { value: '', label: 'Todos los movimientos' },
    { value: 'POSITIVOS', label: 'Movimientos positivos (+)' },
    { value: 'NEGATIVOS', label: 'Movimientos negativos (-)' }
  ];

  useEffect(() => {
    cargarTransacciones();
  }, []);

  const cargarTransacciones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transacciones_sortly')
        .select('*')
        .order('fecha_transaccion', { ascending: false });

      if (error) {
        console.error('Error cargando transacciones:', error);
        toast.error('Error al cargar las transacciones: ' + error.message);
        return;
      }

      setTransacciones(data || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error inesperado al cargar transacciones');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarTransaccion = async (datos: any) => {
    // Verificar que el usuario esté autenticado
    if (!user) {
      toast.error('Debes iniciar sesión para realizar esta acción');
      return;
    }

    try {
      // Asegurar que la fecha se guarde correctamente (solo la fecha, sin hora)
      const datosLimpios = {
        ...datos,
        fecha_transaccion: datos.fecha_transaccion // Ya viene en formato YYYY-MM-DD del input
      };

      if (transaccionEditando) {
        // Actualizar transacción existente
        const { error } = await supabase
          .from('transacciones_sortly')
          .update({
            ...datosLimpios,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaccionEditando.id);

        if (error) throw error;
        toast.success('Transacción actualizada correctamente');
      } else {
        // Crear nueva transacción
        const transaccionData: any = {
          ...datosLimpios
        };
        
        // Agregar created_by solo si tenemos el ID del usuario
        if (user?.id) {
          transaccionData.created_by = user.id;
        }

        const { error } = await supabase
          .from('transacciones_sortly')
          .insert([transaccionData]);

        if (error) throw error;
        toast.success('Transacción registrada correctamente');
      }

      setMostrarFormulario(false);
      setTransaccionEditando(null);
      cargarTransacciones();
    } catch (error: any) {
      console.error('Error guardando transacción:', error);
      
      let errorMessage = 'Error desconocido';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code) {
        switch (error.code) {
          case '23503':
            errorMessage = 'Error de referencia en la base de datos';
            break;
          case '23505':
            errorMessage = 'Ya existe una transacción con estos datos';
            break;
          default:
            errorMessage = `Error de base de datos (${error.code})`;
        }
      }
      
      toast.error('Error al guardar la transacción: ' + errorMessage);
    }
  };

  const handleEliminarTransaccion = async (id: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para realizar esta acción');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar esta transacción?')) return;

    try {
      const { error } = await supabase
        .from('transacciones_sortly')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Transacción eliminada correctamente');
      cargarTransacciones();
    } catch (error: any) {
      console.error('Error eliminando transacción:', error);
      
      let errorMessage = 'Error desconocido';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code) {
        errorMessage = `Error de base de datos (${error.code})`;
      }
      
      toast.error('Error al eliminar la transacción: ' + errorMessage);
    }
  };

  const transaccionesFiltradas = transacciones.filter(transaccion => {
    const coincideTexto = transaccion.producto_descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaccion.factura_os?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaccion.remision?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaccion.cliente_destino?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const coincideTipo = !filtroTipo || 
                        (filtroTipo === 'POSITIVOS' && transaccion.cantidad > 0) ||
                        (filtroTipo === 'NEGATIVOS' && transaccion.cantidad < 0);
    
    return coincideTexto && coincideTipo;
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acceso Requerido</h2>
          <p className="text-gray-600">Debes iniciar sesión para acceder a este módulo.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transacciones de Sortly</h1>
              <p className="text-gray-600">Historial de transacciones migradas desde Sortly</p>
            </div>
          </div>
          <Button 
            onClick={() => setMostrarFormulario(true)} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </Button>
        </div>

      {/* Filtros y Búsqueda */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por producto, documento o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              {tiposFiltro.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Transacciones */}
      <TablaTransacciones
        transacciones={transaccionesFiltradas}
        loading={loading}
        onEditar={(transaccion) => {
          setTransaccionEditando(transaccion);
          setMostrarFormulario(true);
        }}
        onEliminar={handleEliminarTransaccion}
      />

        {/* Modal Formulario */}
        {mostrarFormulario && (
          <FormularioTransaccion
            transaccion={transaccionEditando}
            onGuardar={handleGuardarTransaccion}
            onCancelar={() => {
              setMostrarFormulario(false);
              setTransaccionEditando(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}