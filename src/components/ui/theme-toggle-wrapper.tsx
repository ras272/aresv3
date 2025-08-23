'use client';

import React from 'react';
import { ThemeToggle, ThemeToggleProps } from './theme-toggle';
import { HydrationErrorBoundary } from '../HydrationErrorBoundary';

/**
 * Wrapper robusto para ThemeToggle que maneja errores de hidratación
 * y proporciona fallbacks seguros para problemas de tema
 */
export function ThemeToggleWrapper(props: ThemeToggleProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    // Asegurar que estamos en el cliente antes de renderizar el theme toggle
    setIsClient(true);
  }, []);

  // Renderizar placeholder durante SSR/hidratación
  if (!isClient) {
    return (
      <div className="flex items-center space-x-3 animate-pulse">
        <div className="size-4 bg-muted rounded-full" />
        <div className="w-9 h-5 bg-muted rounded-full" />
        <div className="size-4 bg-muted rounded-full" />
        {props.showLabel && <div className="w-16 h-4 bg-muted rounded" />}
      </div>
    );
  }

  return (
    <HydrationErrorBoundary
      fallback={
        <div className="flex items-center space-x-2 opacity-75">
          <div className="size-4 bg-gray-300 rounded-full" />
          <span className="text-sm text-gray-500">Theme</span>
        </div>
      }
    >
      <ThemeToggle {...props} />
    </HydrationErrorBoundary>
  );
}

// Re-exportar el tipo para conveniencia
export type { ThemeToggleProps };