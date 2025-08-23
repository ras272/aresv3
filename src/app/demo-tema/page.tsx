'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ModernThemeToggle } from '@/components/ui/modern-theme-toggle';
import { FloatingThemeToggle } from '@/components/ui/floating-theme-toggle';
import { useTheme } from 'next-themes';
import { 
  Sun, 
  Moon, 
  Palette, 
  Eye, 
  Heart, 
  Star, 
  Zap, 
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle
} from 'lucide-react';

export default function DemoTemaPage() {
  const { theme, resolvedTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
            <Palette className="size-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
            Tema Oscuro Completo
          </h1>
        </div>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Descubre el nuevo tema oscuro de ARES Paraguay con colores OKLCH modernos, 
          animaciones fluidas y una experiencia visual elegante.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon className="size-4 text-blue-400" />
            ) : (
              <Sun className="size-4 text-yellow-500" />
            )}
            <span>Tema actual: <strong>{isDark ? 'Oscuro' : 'Claro'}</strong></span>
          </div>
        </div>
      </div>

      {/* Theme Toggles Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="size-5" />
            Controles de Tema
          </CardTitle>
          <CardDescription>
            Diferentes variantes del selector de tema con animaciones fluidas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Variante Switch (Completa)</Label>
              <div className="p-4 border rounded-lg bg-card">
                <ModernThemeToggle variant="switch" showLabel={true} />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Variante Minimal</Label>
              <div className="p-4 border rounded-lg bg-card">
                <ModernThemeToggle variant="minimal" showLabel={true} />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sin Label</Label>
              <div className="p-4 border rounded-lg bg-card">
                <ModernThemeToggle variant="switch" showLabel={false} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Paleta de Colores OKLCH
          </CardTitle>
          <CardDescription>
            Colores modernos con mejor percepción visual y contraste perfecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-primary border shadow-sm"></div>
              <Label className="text-xs">Primary</Label>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-secondary border shadow-sm"></div>
              <Label className="text-xs">Secondary</Label>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-accent border shadow-sm"></div>
              <Label className="text-xs">Accent</Label>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-muted border shadow-sm"></div>
              <Label className="text-xs">Muted</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5" />
              Botones y Estados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructivo</Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Pequeño</Button>
              <Button size="default">Normal</Button>
              <Button size="lg">Grande</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5" />
              Badges y Estados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="size-3 mr-1" />
                Activo
              </Badge>
              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                <AlertCircle className="size-3 mr-1" />
                Pendiente
              </Badge>
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                <Info className="size-3 mr-1" />
                Info
              </Badge>
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                <XCircle className="size-3 mr-1" />
                Error
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="size-5" />
            Formularios
          </CardTitle>
          <CardDescription>
            Inputs y controles con estilos mejorados para tema oscuro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" placeholder="Ingresa tu nombre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje</Label>
            <textarea 
              id="message"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Escribe tu mensaje aquí..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts Colors Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Colores de Gráficos</CardTitle>
          <CardDescription>
            Paleta moderna para visualizaciones de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div 
                  className={`h-16 rounded-lg border shadow-sm`}
                  style={{ backgroundColor: `hsl(var(--chart-${i}))` }}
                ></div>
                <Label className="text-xs">Chart {i}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-8 border-t">
        <p className="text-muted-foreground mb-4">
          🎨 Tema oscuro implementado con tecnología OKLCH para mejor percepción visual
        </p>
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <span>• Animaciones fluidas</span>
          <span>• Contraste perfecto</span>
          <span>• Hidratación sin parpadeos</span>
          <span>• Diseño moderno</span>
        </div>
      </div>

      {/* Floating Theme Toggle (opcional) */}
      <FloatingThemeToggle />
    </div>
  );
}