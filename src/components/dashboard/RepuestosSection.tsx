'use client';

import { RepuestosDashboard } from '@/components/repuestos/RepuestosDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export function RepuestosSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Inventario de Repuestos</h2>
      </div>
      
      <RepuestosDashboard />
    </div>
  );
}