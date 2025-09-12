'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * Página 404 - No encontrado
 * Se muestra cuando el usuario navega a una ruta que no existe
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6">
            <img 
              src="/404.png" 
              alt="Página no encontrada"
              className="mx-auto h-32 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Página No Encontrada
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Información adicional */}
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Error <span className="font-mono font-semibold">404</span> - Recurso no encontrado
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Ir al Dashboard
              </Link>
            </Button>
            
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver Atrás
            </Button>
          </div>

          {/* Sugerencias */}
          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground mb-2">
              También puedes probar:
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <Link href="/equipos" className="text-primary hover:underline">
                Equipos
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/stock" className="text-primary hover:underline">
                Stock
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/clinicas" className="text-primary hover:underline">
                Clínicas
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/documentos" className="text-primary hover:underline">
                Documentos
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Sistema ARES Paraguay - Gestión Médica
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}