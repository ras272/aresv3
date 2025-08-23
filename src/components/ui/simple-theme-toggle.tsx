'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SimpleThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Versión simplificada del ThemeToggle que evita problemas de hidratación
 * usando un enfoque minimalista y sin hooks complejos
 */
export function SimpleThemeToggle({ className, showLabel = true }: SimpleThemeToggleProps) {
  const [mounted, setMounted] = React.useState(false);

  // Hook de hidratación simple
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Renderizar placeholder durante SSR
  if (!mounted) {
    return (
      <div className={cn('flex items-center space-x-3', className)}>
        {/* Sol skeleton */}
        <div className="size-4 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full animate-pulse" />
        
        {/* Switch skeleton con animación de carga */}
        <div className="relative">
          <div className="w-9 h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse" />
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm animate-bounce" />
        </div>
        
        {/* Luna skeleton */}
        <div className="size-4 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        
        {showLabel && (
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gradient-to-br from-purple-200 to-purple-300 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
            <div className="w-16 h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
        )}
      </div>
    );
  }

  return <ThemeToggleContent className={className} showLabel={showLabel} />;
}

// Componente separado que solo se renderiza después de la hidratación
function ThemeToggleContent({ className, showLabel }: SimpleThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const isDarkMode = theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');
  
  const handleToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div 
      className={cn('flex items-center space-x-3', className)}
      role="group"
      aria-label="Theme toggle controls"
    >
      <Sun 
        className={cn(
          'size-4 transition-all duration-500 ease-in-out transform',
          'hover:animate-icon-bounce cursor-pointer',
          isDarkMode 
            ? 'text-muted-foreground opacity-30 scale-75 rotate-180 blur-[0.5px]' 
            : 'text-yellow-500 opacity-100 scale-100 rotate-0 drop-shadow-lg animate-theme-glow'
        )}
        aria-hidden="true"
      />
      
      <div className="relative">
        <Switch
          checked={isDarkMode}
          onCheckedChange={handleToggle}
          aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          className={cn(
            'transition-all duration-300 ease-in-out transform',
            'hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-400',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-background'
          )}
        />
        
        {/* Efecto de brillo al cambiar con animación personalizada */}
        <div 
          className={cn(
            'absolute inset-0 rounded-full transition-all duration-700 pointer-events-none',
            'bg-gradient-to-r from-transparent via-white/30 to-transparent',
            isDarkMode 
              ? 'animate-theme-glow opacity-30' 
              : 'opacity-0'
          )}
        />
      </div>
      
      <Moon 
        className={cn(
          'size-4 transition-all duration-500 ease-in-out transform',
          'hover:animate-icon-bounce cursor-pointer',
          isDarkMode 
            ? 'text-blue-400 opacity-100 scale-100 rotate-0 drop-shadow-lg animate-theme-glow' 
            : 'text-muted-foreground opacity-30 scale-75 -rotate-180 blur-[0.5px]'
        )}
        aria-hidden="true"
      />
      
      {showLabel && (
        <span 
          className={cn(
            'text-sm font-medium transition-all duration-400 ease-in-out',
            'transform translate-x-0',
            isDarkMode 
              ? 'text-foreground' 
              : 'text-foreground'
          )}
          aria-live="polite"
        >
          <span className="animate-theme-slide">
            {isDarkMode ? 'Oscuro' : 'Claro'}
          </span>
        </span>
      )}
    </div>
  );
}