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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {/* Cargas 2025 */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-800">Cargas 2025</CardTitle>
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
        </CardHeader>
        <CardContent className="pt-1 sm:pt-2">
          <div className="text-xl sm:text-2xl font-bold text-green-900">{estadisticas2025.cargas2025}</div>
          <p className="text-[10px] sm:text-xs text-green-700">
            Cargas este año
          </p>
        </CardContent>
      </Card>

      {/* Cargas Hoy */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-800">Cargas Hoy</CardTitle>
          <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
        </CardHeader>
        <CardContent className="pt-1 sm:pt-2">
          <div className="text-xl sm:text-2xl font-bold text-blue-900">{estadisticas2025.cargasHoy}</div>
          <p className="text-[10px] sm:text-xs text-blue-700">
            Cargas hoy
          </p>
        </CardContent>
      </Card>

      {/* Total Productos 2025 */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-purple-800">Productos 2025</CardTitle>
          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
        </CardHeader>
        <CardContent className="pt-1 sm:pt-2">
          <div className="text-xl sm:text-2xl font-bold text-purple-900">{estadisticas2025.totalProductos2025}</div>
          <p className="text-[10px] sm:text-xs text-purple-700">
            Total productos
          </p>
        </CardContent>
      </Card>

      {/* Equipos Médicos */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-orange-800">Equipos 2025</CardTitle>
          <Target className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
        </CardHeader>
        <CardContent className="pt-1 sm:pt-2">
          <div className="text-xl sm:text-2xl font-bold text-orange-900">{estadisticas2025.equiposMedicos2025}</div>
          <p className="text-[10px] sm:text-xs text-orange-700">
            Equipos técnicos
          </p>
        </CardContent>
      </Card>

      {/* Top Marcas */}
      <Card className="col-span-2 lg:col-span-4">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Top Marcas 2025</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 sm:pt-2">
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {estadisticas2025.topMarcas.map(([marca, cantidad], index) => (
              <Badge 
                key={marca} 
                variant="secondary"
                className={`text-xs sm:text-sm ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                  index === 1 ? 'bg-gray-100 text-gray-800 border-gray-300' :
                  index === 2 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                #{index + 1} {marca}: {cantidad}
              </Badge>
            ))}
          </div>
          {estadisticas2025.topMarcas.length === 0 && (
            <p className="text-gray-500 text-xs sm:text-sm">No hay datos de marcas aún</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 