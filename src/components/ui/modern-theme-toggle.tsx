'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface ModernThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'switch' | 'minimal' | 'floating';
}

export function ModernThemeToggle({ 
  className, 
  showLabel = true,
  variant = 'switch'
}: ModernThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  
  const isDarkMode = theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };
  
  if (!mounted) {
    return (
      <div className={cn('flex items-center space-x-3 animate-pulse', className)}>
        <div className="size-4 bg-muted rounded-full" />
        <div className="w-9 h-5 bg-muted rounded-full" />
        <div className="size-4 bg-muted rounded-full" />
        {showLabel && <div className="w-12 h-4 bg-muted rounded" />}
      </div>
    );
  }
  
  if (variant === 'minimal') {
    return (
      <button
        onClick={() => handleToggle(!isDarkMode)}
        className={cn(
          'group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300',
          'hover:bg-accent/50 hover:scale-105 active:scale-95',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
      >
        <div className="relative">
          <Sun 
            className={cn(
              'size-4 transition-all duration-500 absolute',
              isDarkMode 
                ? 'opacity-0 rotate-90 scale-75' 
                : 'opacity-100 rotate-0 scale-100'
            )}
          />
          <Moon 
            className={cn(
              'size-4 transition-all duration-500 absolute',
              isDarkMode 
                ? 'opacity-100 rotate-0 scale-100' 
                : 'opacity-0 -rotate-90 scale-75'
            )}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium transition-all duration-300">
            {isDarkMode ? 'Oscuro' : 'Claro'}
          </span>
        )}
      </button>
    );
  }
  
  if (variant === 'floating') {
    return (
      <div className={cn(
        'fixed bottom-6 right-6 z-50',
        className
      )}>
        <button
          onClick={() => handleToggle(!isDarkMode)}
          className={cn(
            'group flex items-center justify-center size-12 rounded-full shadow-lg',
            'bg-background border border-border backdrop-blur-sm',
            'hover:scale-110 hover:shadow-xl active:scale-95',
            'transition-all duration-300 ease-out',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
          aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
        >
          <div className="relative">
            <Sun 
              className={cn(
                'size-5 transition-all duration-500 absolute inset-0',
                'text-yellow-500',
                isDarkMode 
                  ? 'opacity-0 rotate-180 scale-50' 
                  : 'opacity-100 rotate-0 scale-100'
              )}
            />
            <Moon 
              className={cn(
                'size-5 transition-all duration-500 absolute inset-0',
                'text-blue-400',
                isDarkMode 
                  ? 'opacity-100 rotate-0 scale-100' 
                  : 'opacity-0 -rotate-180 scale-50'
              )}
            />
          </div>
        </button>
      </div>
    );
  }
  
  // Default switch variant
  return (
    <div 
      className={cn('flex items-center space-x-3', className)}
      role="group"
      aria-label="Control de tema"
    >
      {/* Icono Sol */}
      <Sun 
        className={cn(
          'size-4 transition-all duration-500 ease-out cursor-pointer',
          isDarkMode 
            ? 'text-muted-foreground opacity-40 scale-90 rotate-180' 
            : 'text-yellow-500 opacity-100 scale-100 rotate-0 drop-shadow-sm'
        )}
        onClick={() => handleToggle(false)}
        aria-hidden="true"
      />
      
      {/* Switch */}
      <Switch
        checked={isDarkMode}
        onCheckedChange={handleToggle}
        aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
        className={cn(
          'transition-all duration-300 ease-out',
          'hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted'
        )}
      />
      
      {/* Icono Luna */}
      <Moon 
        className={cn(
          'size-4 transition-all duration-500 ease-out cursor-pointer',
          isDarkMode 
            ? 'text-blue-400 opacity-100 scale-100 rotate-0 drop-shadow-sm' 
            : 'text-muted-foreground opacity-40 scale-90 -rotate-180'
        )}
        onClick={() => handleToggle(true)}
        aria-hidden="true"
      />
      
      {/* Label */}
      {showLabel && (
        <span 
          className={cn(
            'text-sm font-medium transition-all duration-300 ease-out',
            'select-none'
          )}
          aria-live="polite"
        >
          {isDarkMode ? 'Oscuro' : 'Claro'}
        </span>
      )}
    </div>
  );
}