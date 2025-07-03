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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ingreso de Mercaderías
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión de cargas múltiples para Ares Paraguay
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setMostrarVerificador(!mostrarVerificador)}
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {mostrarVerificador ? 'Ocultar' : 'Verificar'} Sistema
            </Button>
            <Button
              onClick={() => router.push('/mercaderias/nueva')}
              className="bg-blue-600 hover:bg-blue-700"
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

        {/* Tabla de cargas */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Cargas</CardTitle>
          </CardHeader>
          <CardContent>
            <TablaCargas />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 