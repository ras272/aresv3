"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

interface RepuestoUtilizado {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  cantidad: number;
  stockAntes: number;
}

interface RepuestosViewerProps {
  repuestos: RepuestoUtilizado[];
}

export function RepuestosViewer({ repuestos }: RepuestosViewerProps) {
  if (!repuestos || repuestos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Package className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-900">
          Repuestos Utilizados ({repuestos.length})
        </span>
      </div>
      
      <div className="space-y-2">
        {repuestos.map((repuesto, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">{repuesto.nombre}</h4>
                  <p className="text-xs text-gray-600">
                    {repuesto.marca} {repuesto.modelo}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {repuesto.cantidad}x
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Stock: {repuesto.stockAntes} → {repuesto.stockAntes - repuesto.cantidad}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}