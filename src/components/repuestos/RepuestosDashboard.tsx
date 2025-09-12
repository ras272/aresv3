'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  getRepuestos, 
  getMovimientosRecientes 
} from '@/lib/repuestos-database';
import { Repuesto, MovimientoRepuesto } from '@/types';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  ArrowDownUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';

export function RepuestosDashboard() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar repuestos
      const repuestosData = await getRepuestos();
      setRepuestos(repuestosData);
      
      // Cargar movimientos recientes
      const movimientosData = await getMovimientosRecientes();
      setMovimientos(movimientosData);
    } catch (error) {
      console.error('Error al cargar datos del dashboard de repuestos:', error);
      toast.error('Error al cargar los datos del dashboard de repuestos');
    } finally {
      setLoading(false);
    }
  };

  // Métricas calculadas
  const totalRepuestos = repuestos.length;
  const stockBajo = repuestos.filter(r => r.cantidad_actual <= r.cantidad_minima).length;
  const agotados = repuestos.filter(r => r.cantidad_actual === 0).length;
  const categorias = [...new Set(repuestos.map(r => r.categoria).filter(Boolean))].length;

  const getMovimientoIcon = (tipo: string) => {
    switch (tipo) {
      case 'Entrada':
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case 'Salida':
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowDownUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getMovimientoBadge = (tipo: string) => {
    switch (tipo) {
      case 'Entrada':
        return <Badge className="bg-green-100 text-green-800">Entrada</Badge>;
      case 'Salida':
        return <Badge className="bg-red-100 text-red-800">Salida</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">{tipo}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repuestos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRepuestos}</div>
            <p className="text-xs text-muted-foreground">
              Repuestos en inventario
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockBajo}</div>
            <p className="text-xs text-muted-foreground">
              Repuestos con stock bajo
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agotados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agotados}</div>
            <p className="text-xs text-muted-foreground">
              Repuestos sin stock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorias}</div>
            <p className="text-xs text-muted-foreground">
              Categorías diferentes
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Últimos movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Movimientos</CardTitle>
          <CardDescription>
            Registro de entradas y salidas recientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movimientos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium">Sin movimientos</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Aún no hay movimientos registrados.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repuesto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((movimiento) => (
                  <TableRow key={movimiento.id}>
                    <TableCell className="font-medium">
                      {movimiento.repuesto_nombre || movimiento.nombre || 'Sin nombre'}
                      <div className="text-xs text-muted-foreground">
                        {movimiento.codigo_repuesto || movimiento.codigo || 'Sin código'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovimientoIcon(movimiento.tipo_movimiento || movimiento.tipo)}
                        {getMovimientoBadge(movimiento.tipo_movimiento || movimiento.tipo)}
                      </div>
                    </TableCell>
                    <TableCell>{movimiento.cantidad}</TableCell>
                    <TableCell>
                      {movimiento.fecha_movimiento ? new Date(movimiento.fecha_movimiento).toLocaleDateString() : 'Sin fecha'}
                    </TableCell>
                    <TableCell>{movimiento.motivo || 'Sin motivo'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}