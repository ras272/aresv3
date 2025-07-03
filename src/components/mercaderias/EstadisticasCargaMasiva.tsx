'use client';

import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Package, Zap, Target, BarChart3 } from 'lucide-react';

export function EstadisticasCargaMasiva() {
  const { cargasMercaderia } = useAppStore();

  // 📊 ESTADÍSTICAS ESPECÍFICAS PARA CARGA MASIVA 2025
  const estadisticas2025 = (() => {
    const cargas2025 = cargasMercaderia.filter(carga => 
      carga.fechaIngreso.startsWith('2025')
    );

    const cargasHoy = cargasMercaderia.filter(
      carga => carga.fechaIngreso === new Date().toISOString().split('T')[0]
    );

    const productosPorMarca = cargas2025.reduce((acc, carga) => {
      carga.productos.forEach(producto => {
        acc[producto.marca] = (acc[producto.marca] || 0) + producto.cantidad;
      });
      return acc;
    }, {} as Record<string, number>);

    const topMarcas = Object.entries(productosPorMarca)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const equiposMedicos2025 = cargas2025.reduce((acc, carga) => {
      return acc + carga.productos.filter(p => p.tipoProducto === 'Equipo Médico').length;
    }, 0);

    const totalProductos2025 = cargas2025.reduce((acc, carga) => 
      acc + carga.productos.length, 0
    );

    return {
      cargas2025: cargas2025.length,
      cargasHoy: cargasHoy.length,
      totalProductos2025,
      equiposMedicos2025,
      topMarcas,
      ultimaCarga: cargas2025[0]?.fechaIngreso || 'N/A'
    };
  })();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Cargas 2025 */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Cargas 2025</CardTitle>
          <Calendar className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{estadisticas2025.cargas2025}</div>
          <p className="text-xs text-green-700">
            Cargas registradas este año
          </p>
        </CardContent>
      </Card>

      {/* Cargas Hoy */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-800">Cargas Hoy</CardTitle>
          <Zap className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{estadisticas2025.cargasHoy}</div>
          <p className="text-xs text-blue-700">
            Cargas del día actual
          </p>
        </CardContent>
      </Card>

      {/* Total Productos 2025 */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-800">Productos 2025</CardTitle>
          <Package className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">{estadisticas2025.totalProductos2025}</div>
          <p className="text-xs text-purple-700">
            Total productos registrados
          </p>
        </CardContent>
      </Card>

      {/* Equipos Médicos */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-800">Equipos 2025</CardTitle>
          <Target className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900">{estadisticas2025.equiposMedicos2025}</div>
          <p className="text-xs text-orange-700">
            Equipos a Servicio Técnico
          </p>
        </CardContent>
      </Card>

      {/* Top Marcas */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Top Marcas 2025 por Cantidad de Productos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {estadisticas2025.topMarcas.map(([marca, cantidad], index) => (
              <Badge 
                key={marca} 
                variant="secondary"
                className={`text-sm ${
                  index === 0 ? 'bg-gold-100 text-gold-800 border-gold-300' : 
                  index === 1 ? 'bg-silver-100 text-silver-800 border-silver-300' :
                  index === 2 ? 'bg-bronze-100 text-bronze-800 border-bronze-300' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                #{index + 1} {marca}: {cantidad} productos
              </Badge>
            ))}
          </div>
          {estadisticas2025.topMarcas.length === 0 && (
            <p className="text-gray-500 text-sm">No hay datos de marcas aún</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 