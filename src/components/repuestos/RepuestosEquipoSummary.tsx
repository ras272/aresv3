'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRepuestosPorEquipo } from '@/lib/repuestos-database';
import { UsoRepuestoConInfo } from '@/types';
import { Package, Wrench } from 'lucide-react';
import { toast } from 'sonner';

interface RepuestosEquipoSummaryProps {
  equipoId: string;
}

export function RepuestosEquipoSummary({ equipoId }: RepuestosEquipoSummaryProps) {
  const [repuestos, setRepuestos] = useState<UsoRepuestoConInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRepuestos();
  }, [equipoId]);

  const loadRepuestos = async () => {
    try {
      setLoading(true);
      const data = await getRepuestosPorEquipo(equipoId);
      setRepuestos(data);
    } catch (error) {
      console.error('Error al cargar repuestos del equipo:', error);
      toast.error('Error al cargar los repuestos del equipo');
    } finally {
      setLoading(false);
    }
  };

  const getMotivoBadge = (motivo: string) => {
    switch (motivo.toLowerCase()) {
      case 'reparacion':
        return <Badge className="bg-red-100 text-red-800">Reparación</Badge>;
      case 'mantenimiento':
        return <Badge className="bg-blue-100 text-blue-800">Mantenimiento</Badge>;
      case 'upgrade':
        return <Badge className="bg-green-100 text-green-800">Upgrade</Badge>;
      case 'instalacion':
        return <Badge className="bg-purple-100 text-purple-800">Instalación</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{motivo}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Repuestos Utilizados
        </CardTitle>
        <CardDescription>
          Historial de repuestos asignados a este equipo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {repuestos.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium">Sin repuestos asignados</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aún no se han asignado repuestos a este equipo.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repuesto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Técnico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repuestos.map((uso) => (
                <TableRow key={uso.id}>
                  <TableCell className="font-medium">{uso.repuesto_nombre}</TableCell>
                  <TableCell>{uso.repuesto_codigo}</TableCell>
                  <TableCell>{uso.cantidad_usada}</TableCell>
                  <TableCell>{getMotivoBadge(uso.motivo_uso)}</TableCell>
                  <TableCell>
                    {new Date(uso.fecha_uso).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {uso.tecnico_responsable || 'No especificado'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}