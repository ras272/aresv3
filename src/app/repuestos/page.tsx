'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { getRepuestos } from '@/lib/repuestos-database';
import { Repuesto } from '@/types';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function RepuestosPage() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [filteredRepuestos, setFilteredRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar repuestos al montar el componente
  useEffect(() => {
    loadRepuestos();
  }, []);

  // Filtrar repuestos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRepuestos(repuestos);
    } else {
      const filtered = repuestos.filter(repuesto => 
        repuesto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repuesto.codigo_repuesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repuesto.marca && repuesto.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (repuesto.numero_serie && repuesto.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRepuestos(filtered);
    }
  }, [searchTerm, repuestos]);

  const loadRepuestos = async () => {
    try {
      setLoading(true);
      const data = await getRepuestos();
      setRepuestos(data);
      setFilteredRepuestos(data);
    } catch (error) {
      console.error('Error al cargar repuestos:', error);
      toast.error('Error al cargar los repuestos');
    } finally {
      setLoading(false);
    }
  };

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

  const getStockStatus = (actual: number, minimo: number) => {
    if (actual === 0) {
      return <span className="text-red-500 font-medium">Agotado</span>;
    } else if (actual <= minimo) {
      return <span className="text-yellow-500 font-medium">Stock bajo</span>;
    } else {
      return <span className="text-green-500 font-medium">Suficiente</span>;
    }
  };

  return (
    <DashboardLayout 
      title="Repuestos" 
      subtitle="Gestión de inventario de componentes y repuestos técnicos"
    >
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Repuestos</h1>
            <p className="text-muted-foreground">
              Inventario de componentes y repuestos técnicos generados desde cargas de mercaderías
            </p>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Repuestos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repuestos.length}</div>
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
              <div className="text-2xl font-bold">
                {repuestos.filter(r => r.cantidad_actual <= r.cantidad_minima).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Repuestos con stock bajo
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {[...new Set(repuestos.map(r => r.categoria).filter(Boolean))].length}
              </div>
              <p className="text-xs text-muted-foreground">
                Categorías diferentes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar repuestos por nombre, código, marca o número de serie..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla de repuestos */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Repuestos</CardTitle>
            <CardDescription>
              Repuestos registrados automáticamente desde cargas de mercaderías
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredRepuestos.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No hay repuestos registrados</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Los repuestos aparecerán aquí cuando los agregues desde una carga de mercaderías.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Marca/Modelo</TableHead>
                    <TableHead>N° Serie</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Stock Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRepuestos.map((repuesto) => (
                    <TableRow key={repuesto.id}>
                      <TableCell className="font-medium">{repuesto.codigo_repuesto}</TableCell>
                      <TableCell>{repuesto.nombre}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {repuesto.marca && <div>{repuesto.marca}</div>}
                          {repuesto.modelo && <div className="text-muted-foreground">{repuesto.modelo}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {repuesto.numero_serie || <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>{repuesto.categoria || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{repuesto.cantidad_actual}</div>
                        <div className="text-xs text-muted-foreground">Mín: {repuesto.cantidad_minima}</div>
                      </TableCell>
                      <TableCell>{getEstadoBadge(repuesto.estado)}</TableCell>
                      <TableCell>{getStockStatus(repuesto.cantidad_actual, repuesto.cantidad_minima)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}