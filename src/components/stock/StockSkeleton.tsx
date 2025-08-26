"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StockSkeletonProps {
  vistaCompacta?: boolean;
  cantidad?: number;
}

export function StockSkeleton({ vistaCompacta = false, cantidad = 6 }: StockSkeletonProps) {
  return (
    <div className={`grid gap-4 ${
      vistaCompacta 
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }`}>
      {Array.from({ length: cantidad }).map((_, index) => (
        <Card key={index} className="h-full border border-gray-200">
          <CardContent className={`p-4 h-full flex flex-col ${
            vistaCompacta ? 'space-y-2' : 'space-y-3'
          }`}>
            {/* Header del producto */}
            <div className="flex items-start space-x-3">
              {/* Imagen del producto */}
              <Skeleton className={`flex-shrink-0 rounded-lg ${
                vistaCompacta ? 'w-12 h-12' : 'w-16 h-16'
              }`} />
              
              {/* Información del producto */}
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className={`h-4 w-full ${vistaCompacta ? 'max-w-24' : 'max-w-32'}`} />
                <Skeleton className={`h-3 w-full ${vistaCompacta ? 'max-w-20' : 'max-w-28'}`} />
                {!vistaCompacta && (
                  <Skeleton className="h-3 w-full max-w-24" />
                )}
              </div>
            </div>
            
            {/* Información de stock */}
            <div className="space-y-2">
              <div className="flex justify-center">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              
              <div className={`grid grid-cols-2 gap-2 ${
                vistaCompacta ? 'text-xs' : 'text-sm'
              }`}>
                <Skeleton className="h-12 rounded" />
                <Skeleton className="h-12 rounded" />
              </div>
              
              <div className="text-center">
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            </div>
            
            {/* Información adicional (solo en vista expandida) */}
            {!vistaCompacta && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            )}
            
            {/* Acciones */}
            <div className="flex items-center justify-end space-x-2 mt-auto pt-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CarpetaSkeleton({ cantidad = 3 }: { cantidad?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: cantidad }).map((_, index) => (
        <Card key={index} className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-5" />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-6 w-32" />
                    <div className="flex -space-x-2">
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <Skeleton className="w-6 h-6 rounded-full" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <Skeleton className="h-4 w-40" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}