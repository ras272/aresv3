'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getRepuestoById, 
  getMovimientosRepuesto, 
  asignarRepuestoAEquipo,
  getRepuestosPorEquipo
} from '@/lib/repuestos-database';
import { Repuesto, MovimientoRepuesto, UsoRepuestoConInfo } from '@/types';
import { Search, Plus, Package, Calendar, Hash, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface RepuestoDetailProps {
  repuestoId: string;
}

export function RepuestoDetail({ repuestoId }: RepuestoDetailProps) {
  const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoRepuesto[]>([]);
  const [usos, setUsos] = useState<UsoRepuestoConInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAsignarDialogOpen, setIsAsignarDialogOpen] = useState(false);
  const [asignacionData, setAsignacionData] = useState({
    equipo_id: '',
    cantidad_usada: 1,
    motivo_uso: 'Reparacion',
    tecnico_responsable: '',
    observaciones: '',
  });

  useEffect(() => {
    loadRepuestoData();
  }, [repuestoId]);

  const loadRepuestoData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos del repuesto
      const repuestoData = await getRepuestoById(repuestoId);
      setRepuesto(repuestoData);
      
      // Cargar movimientos
      const movimientosData = await getMovimientosRepuesto(repuestoId);
      setMovimientos(movimientosData);
      
      // TODO: Cargar usos (necesitamos implementar esta función)
      // const usosData = await getUsosRepuesto(repuestoId);
      // setUsos(usosData);
    } catch (error) {
      console.error('Error al cargar datos del repuesto:', error);
      toast.error('Error al cargar los datos del repuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarRepuesto = async () => {
    try {
      await asignarRepuestoAEquipo({
        repuesto_id: repuestoId,
        ...asignacionData,
        mantenimiento_id: null, // Por ahora null, se puede mejorar después
      });
      
      toast.success('Repuesto asignado exitosamente');
      setIsAsignarDialogOpen(false);
      setAsignacionData({
        equipo_id: '',
        cantidad_usada: 1,
        motivo_uso: 'Reparacion',
        tecnico_responsable: '',
        observaciones: '',
      });
      
      // Recargar datos
      loadRepuestoData();
    } catch (error) {
      console.error('Error al asignar repuesto:', error);
      toast.error('Error al asignar el repuesto');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!repuesto) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium">Repuesto no encontrado</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No se pudo encontrar el repuesto solicitado.
        </p>
      </div>
    );
  }

  const getEstadoBadge = (estado: Repuesto['estado']) => {
    switch (estado) {
      case 'Disponible':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'Reservado':
        return <Badge className="bg-yellow-100 text-yellow-800">Reservado</Badge>;
      case 'En_uso':
        return <Badge className="bg-blue-100 text-blue-800">En uso</Badge>;
      case 'Dañado':
        return <Badge className="bg-red-100 text-red-800">Dañado</Badge>;
      case 'Vencido':
        return <Badge className="bg-gray-100 text-gray-800">Vencido</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Información del repuesto */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {repuesto.nombre}
                {getEstadoBadge(repuesto.estado)}
              </CardTitle>
              <CardDescription>
                Código: {repuesto.codigo_repuesto}
              </CardDescription>
            </div>
            <Dialog open={isAsignarDialogOpen} onOpenChange={setIsAsignarDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Asignar a Equipo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asignar Repuesto a Equipo</DialogTitle>
                  <DialogDescription>
                    Ingresa la información para asignar este repuesto a un equipo
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="equipo_id">ID del Equipo</Label>
                    <Input
                      id="equipo_id"
                      value={asignacionData.equipo_id}
                      onChange={(e) => setAsignacionData({...asignacionData, equipo_id: e.target.value})}
                      placeholder="ID del equipo"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cantidad_usada">Cantidad a Usar</Label>
                    <Input
                      id="cantidad_usada"
                      type="number"
                      min="1"
                      max={repuesto.cantidad_actual}
                      value={asignacionData.cantidad_usada}
                      onChange={(e) => setAsignacionData({...asignacionData, cantidad_usada: Number(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="motivo_uso">Motivo de Uso</Label>
                    <select
                      id="motivo_uso"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={asignacionData.motivo_uso}
                      onChange={(e) => setAsignacionData({...asignacionData, motivo_uso: e.target.value})}
                    >
                      <option value="Reparacion">Reparación</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Upgrade">Upgrade</option>
                      <option value="Instalacion">Instalación</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tecnico_responsable">Técnico Responsable</Label>
                    <Input
                      id="tecnico_responsable"
                      value={asignacionData.tecnico_responsable}
                      onChange={(e) => setAsignacionData({...asignacionData, tecnico_responsable: e.target.value})}
                      placeholder="Nombre del técnico"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <textarea
                      id="observaciones"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={asignacionData.observaciones}
                      onChange={(e) => setAsignacionData({...asignacionData, observaciones: e.target.value})}
                      placeholder="Observaciones adicionales"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAsignarDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAsignarRepuesto}
                    disabled={asignacionData.cantidad_usada > repuesto.cantidad_actual || !asignacionData.equipo_id}
                  >
                    Asignar Repuesto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Stock Actual</p>
                <p className="font-medium">{repuesto.cantidad_actual} {repuesto.unidad_medida}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Stock Mínimo</p>
                <p className="font-medium">{repuesto.cantidad_minima} {repuesto.unidad_medida}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Precio Unitario</p>
                <p className="font-medium">
                  {repuesto.precio_unitario ? `${repuesto.precio_unitario} ${repuesto.moneda}` : 'No especificado'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Ingreso</p>
                <p className="font-medium">
                  {repuesto.fecha_ingreso ? new Date(repuesto.fecha_ingreso).toLocaleDateString() : 'No especificada'}
                </p>
              </div>
            </div>
          </div>
          
          {repuesto.descripcion && (
            <div>
              <h3 className="text-sm font-medium mb-2">Descripción</h3>
              <p className="text-muted-foreground">{repuesto.descripcion}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {repuesto.marca && (
              <div>
                <h3 className="text-sm font-medium mb-1">Marca</h3>
                <p className="text-muted-foreground">{repuesto.marca}</p>
              </div>
            )}
            {repuesto.modelo && (
              <div>
                <h3 className="text-sm font-medium mb-1">Modelo</h3>
                <p className="text-muted-foreground">{repuesto.modelo}</p>
              </div>
            )}
            {repuesto.numero_serie && (
              <div>
                <h3 className="text-sm font-medium mb-1">Número de Serie</h3>
                <p className="text-muted-foreground">{repuesto.numero_serie}</p>
              </div>
            )}
          </div>
          
          {repuesto.categoria && (
            <div>
              <h3 className="text-sm font-medium mb-1">Categoría</h3>
              <Badge variant="secondary">{repuesto.categoria}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Historial de movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            Registro de entradas y salidas de este repuesto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movimientos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium">Sin movimientos</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Aún no hay movimientos registrados para este repuesto.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((movimiento) => (
                  <TableRow key={movimiento.id}>
                    <TableCell>
                      {new Date(movimiento.fecha_movimiento).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        movimiento.tipo_movimiento === 'Entrada' ? 'default' :
                        movimiento.tipo_movimiento === 'Salida' ? 'destructive' : 'secondary'
                      }>
                        {movimiento.tipo_movimiento}
                      </Badge>
                    </TableCell>
                    <TableCell>{movimiento.cantidad}</TableCell>
                    <TableCell>{movimiento.motivo}</TableCell>
                    <TableCell>{movimiento.usuario || 'Sistema'}</TableCell>
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