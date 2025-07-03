'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Package, AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function StockDisabledPage() {
  const router = useRouter()

  return (
    <DashboardLayout 
      title="Sistema de Stock" 
      subtitle="Temporalmente desactivado"
    >
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2">
                <AlertCircle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">Sistema Temporalmente Desactivado</h3>
              <p className="text-gray-600">
                El sistema de <strong>Stock</strong> ha sido desactivado temporalmente por solicitud del usuario
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>🔧 El sistema estará disponible próximamente</p>
                <p>📊 Mientras tanto, puedes usar otras funciones</p>
                <p>💡 Para reactivar, contacta al administrador</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Volver al Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button 
                onClick={() => router.push('/inventario-tecnico')}
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Ir a Inventario Técnico
                <Package className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="text-xs text-gray-400">
              Sistema desactivado temporalmente
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 