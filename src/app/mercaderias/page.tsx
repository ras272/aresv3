'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TablaCargas } from '@/components/mercaderias/TablaCargas';
import { EstadisticasCargaMasiva } from '@/components/mercaderias/EstadisticasCargaMasiva';
import { VerificadorSistema } from '@/components/mercaderias/VerificadorSistema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Plus, TrendingUp, Box, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MercaderiasPage() {
  const router = useRouter();
  const { cargasMercaderia } = useAppStore();
  const [mostrarVerificador, setMostrarVerificador] = useState(false);

  // Estadísticas actualizadas para cargas
  const totalCargas = cargasMercaderia.length;
  const cargasHoy = cargasMercaderia.filter(
    carga => carga.fechaIngreso === new Date().toISOString().split('T')[0]
  ).length;
  
  // Contar total de productos y equipos médicos
  const totalProductos = cargasMercaderia.reduce((acc, carga) => acc + carga.productos.length, 0);
  const equiposMedicos = cargasMercaderia.reduce((acc, carga) => {
    return acc + carga.productos.filter(producto => producto.tipoProducto === 'Equipo Médico').length;
  }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Ingreso de Mercaderías
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Gestión de cargas múltiples para Ares Paraguay
            </p>
          </div>
          
          {/* Botones optimizados para móvil */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <Button
              onClick={() => setMostrarVerificador(!mostrarVerificador)}
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50 w-full sm:w-auto"
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{mostrarVerificador ? 'Ocultar' : 'Verificar'} Sistema</span>
              <span className="sm:hidden">{mostrarVerificador ? 'Ocultar' : 'Verificar'}</span>
            </Button>
            <Button
              onClick={() => router.push('/mercaderias/nueva')}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Carga
            </Button>
          </div>
        </div>

        {/* 🚀 Verificador de Sistema (condicional) */}
        {mostrarVerificador && (
          <VerificadorSistema />
        )}

        {/* 🚀 Estadísticas de Carga Masiva 2025 */}
        <EstadisticasCargaMasiva />

        {/* Tabla de cargas - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Últimas Cargas</CardTitle>
          </CardHeader>
          <CardContent className="px-1 sm:px-6">
            <TablaCargas />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 