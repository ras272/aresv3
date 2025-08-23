'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// TypeScript interfaces for component props and theme state
export interface ThemeToggleProps {
  variant?: 'switch' | 'button' | 'compact' | 'cycle';
  className?: string;
  showLabel?: boolean;
  showSystemOption?: boolean;
}

export interface ThemeState {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  resolvedTheme: string | undefined;
  systemTheme: string | undefined;
}

// Theme options for cycling
const THEME_OPTIONS = ['light', 'dark', 'system'] as const;
type ThemeOption = typeof THEME_OPTIONS[number];

export function ThemeToggle({ 
  variant = 'switch', 
  className, 
  showLabel = true,
  showSystemOption = false
}: ThemeToggleProps) {
  const themeContext = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isHydrating, setIsHydrating] = React.useState(true);
  const [hydrationError, setHydrationError] = React.useState(false);

  // Safely extract theme properties with fallbacks
  const { 
    theme = 'system', 
    setTheme = () => {}, 
    resolvedTheme = 'light', 
    systemTheme = 'light' 
  } = themeContext || {};

  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  // Enhanced state management with safe access
  const currentTheme = React.useMemo(() => {
    try {
      return (theme || 'system') as ThemeOption;
    } catch {
      return 'system' as ThemeOption;
    }
  }, [theme]);
  
  const isDarkMode = React.useMemo(() => {
    try {
      return theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');
    } catch {
      return false;
    }
  }, [theme, resolvedTheme]);

  const getCurrentThemeLabel = React.useCallback(() => {
    try {
      if (currentTheme === 'system') {
        return `System (${resolvedTheme || 'auto'})`;
      }
      return currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
    } catch {
      return 'Theme';
    }
  }, [currentTheme, resolvedTheme]);
  
  // Click handlers for cycling through theme states with error handling
  const handleCycleTheme = React.useCallback(() => {
    try {
      const currentIndex = THEME_OPTIONS.indexOf(currentTheme);
      const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
      const nextTheme = THEME_OPTIONS[nextIndex];
      setTheme(nextTheme);
    } catch (error) {
      console.warn('ThemeToggle: Error cycling theme', error);
    }
  }, [currentTheme, setTheme]);

  const handleToggle = React.useCallback((checked: boolean) => {
    try {
      if (showSystemOption && theme === 'system') {
        // If currently on system, switch to explicit light/dark
        setTheme(checked ? 'dark' : 'light');
      } else {
        // Normal light/dark toggle
        setTheme(checked ? 'dark' : 'light');
      }
    } catch (error) {
      console.warn('ThemeToggle: Error toggling theme', error);
    }
  }, [showSystemOption, theme, setTheme]);

  const handleSystemToggle = React.useCallback(() => {
    try {
      setTheme('system');
    } catch (error) {
      console.warn('ThemeToggle: Error setting system theme', error);
    }
  }, [setTheme]);

  // Keyboard navigation support (Enter, Space keys)
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (variant === 'cycle' || variant === 'button' || variant === 'compact') {
        handleCycleTheme();
      } else {
        handleToggle(!isDarkMode);
      }
    }
  }, [variant, handleCycleTheme, handleToggle, isDarkMode]);

  // Visual feedback for current theme state with appropriate icons
  const getThemeIcon = React.useCallback((themeType: ThemeOption) => {
    switch (themeType) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'system':
        return Monitor;
      default:
        return Monitor;
    }
  }, []);

  // Enhanced hydration handling with error recovery
  React.useEffect(() => {
    try {
      setMounted(true);
      
      // Use multiple frames for smooth hydration
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsHydrating(false);
        });
      });
    } catch (error) {
      console.warn('ThemeToggle: Hydration error handled', error);
      setHydrationError(true);
      setIsHydrating(false);
      setMounted(true);
    }
  }, []);

  // NOW SAFE TO HAVE CONDITIONAL RETURNS
  // Return safe fallback if hydration failed
  if (hydrationError) {
    return (
      <div className={cn('flex items-center space-x-2 opacity-50', className)}>
        <div className="size-4 bg-muted rounded-full" />
        {showLabel && <span className="text-sm text-muted-foreground">Theme</span>}
      </div>
    );
  }

  // Enhanced loading state with skeleton that matches the final component
  if (!mounted || isHydrating) {
    const skeletonVariant = variant === 'switch' ? 'switch' : 'button';
    
    if (skeletonVariant === 'switch') {
      return (
        <div className={cn('flex items-center space-x-3 animate-pulse', className)}>
          <div className="size-4 bg-muted rounded-full" />
          <div className="w-9 h-5 bg-muted rounded-full" />
          <div className="size-4 bg-muted rounded-full" />
          {showLabel && <div className="w-16 h-4 bg-muted rounded" />}
          {showSystemOption && <div className="size-6 bg-muted rounded-md ml-2" />}
        </div>
      );
    }
    
    return (
      <div className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-md border animate-pulse',
        variant === 'compact' && 'px-2 py-1',
        className
      )}>
        <div className={cn(
          'bg-muted rounded-full',
          variant === 'compact' ? 'size-3' : 'size-4'
        )} />
        {showLabel && (
          <div className={cn(
            'bg-muted rounded',
            variant === 'compact' ? 'w-8 h-3' : 'w-12 h-4'
          )} />
        )}
      </div>
    );
  }

  if (variant === 'switch') {
    return (
      <div 
        className={cn('flex items-center space-x-3', className)}
        role="group"
        aria-labelledby="theme-toggle-label"
      >
        <span id="theme-toggle-label" className="sr-only">
          Theme selection controls. Current theme: {getCurrentThemeLabel()}
        </span>
        
        <Sun 
          className={cn(
            'size-4 transition-all duration-300 ease-in-out',
            isDarkMode 
              ? 'text-muted-foreground opacity-50 scale-90 rotate-90' 
              : 'text-yellow-500 opacity-100 scale-100 rotate-0 drop-shadow-sm'
          )}
          aria-hidden="true"
        />
        
        <Switch
          checked={isDarkMode}
          onCheckedChange={handleToggle}
          aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode. Currently using ${getCurrentThemeLabel()}.`}
          aria-describedby="theme-switch-description"
          className={cn(
            'transition-all duration-300 ease-in-out',
            'data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200',
            'hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'data-[state=checked]:shadow-lg data-[state=unchecked]:shadow-md',
            'focus-visible:ring-4 focus-visible:ring-offset-4' // Enhanced focus ring
          )}
        />
        
        <span id="theme-switch-description" className="sr-only">
          Toggle between light and dark appearance modes. Use Tab to navigate, Space or Enter to activate.
        </span>
        
        <Moon 
          className={cn(
            'size-4 transition-all duration-300 ease-in-out',
            isDarkMode 
              ? 'text-blue-400 opacity-100 scale-100 rotate-0 drop-shadow-sm' 
              : 'text-muted-foreground opacity-50 scale-90 -rotate-90'
          )}
          aria-hidden="true"
        />
        
        {showLabel && (
          <span 
            className={cn(
              'text-sm font-medium transition-all duration-300 ease-in-out',
              'opacity-0 animate-in fade-in-0 slide-in-from-left-2'
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {isDarkMode ? 'Dark' : 'Light'} Mode
          </span>
        )}
        
        {showSystemOption && (
          <button
            onClick={handleSystemToggle}
            className={cn(
              'ml-2 p-1 rounded-md transition-all duration-200 ease-in-out',
              'hover:bg-accent hover:scale-110 active:scale-95',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'focus-visible:ring-4 focus-visible:ring-offset-4', // Enhanced focus ring
              theme === 'system' && 'bg-accent shadow-inner',
              'group'
            )}
            aria-label={`Use system theme preference. ${theme === 'system' ? 'Currently active' : 'Currently inactive'}.`}
            aria-describedby="system-theme-description"
            title={`System theme ${theme === 'system' ? '(active)' : '(inactive)'}: Follows your device's appearance setting`}
          >
            <Monitor className={cn(
              'size-4 transition-all duration-200',
              'group-hover:scale-110 group-active:scale-95',
              theme === 'system' ? 'text-primary' : 'text-muted-foreground'
            )} />
            <span id="system-theme-description" className="sr-only">
              Automatically matches your device's light or dark mode setting
            </span>
          </button>
        )}
      </div>
    );
  }

  // Button variants with enhanced interactions
  if (variant === 'cycle') {
    const IconComponent = getThemeIcon(currentTheme);
    
    return (
      <button
        onClick={handleCycleTheme}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center space-x-2 px-3 py-2 rounded-md border transition-all duration-300 ease-in-out',
          'hover:bg-accent hover:scale-105 hover:shadow-md hover:border-primary/20',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-4 focus-visible:ring-offset-4', // Enhanced focus ring
          'active:scale-95 active:shadow-sm',
          'group relative overflow-hidden',
          className
        )}
        aria-label={`Current theme: ${getCurrentThemeLabel()}. Click to cycle to next theme.`}
        aria-describedby="cycle-button-description"
        title={`Current: ${getCurrentThemeLabel()}`}
        role="button"
        tabIndex={0}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
        
        <IconComponent 
          className={cn(
            'size-4 transition-all duration-300 ease-in-out relative z-10',
            'group-hover:scale-110 group-active:scale-95',
            currentTheme === 'light' && 'text-yellow-500 rotate-0 drop-shadow-sm',
            currentTheme === 'dark' && 'text-blue-400 rotate-180 drop-shadow-sm',
            currentTheme === 'system' && 'text-gray-500 scale-110 drop-shadow-sm'
          )}
          aria-hidden="true"
        />
        {showLabel && (
          <span className={cn(
            'text-sm font-medium transition-all duration-300 ease-in-out relative z-10',
            'group-hover:text-foreground'
          )}>
            {getCurrentThemeLabel()}
          </span>
        )}
        <span id="cycle-button-description" className="sr-only">
          Cycles through light, dark, and system theme options. Use Enter or Space to activate.
        </span>
      </button>
    );
  }

  // Standard button variant
  const IconComponent = getThemeIcon(currentTheme);
  
  return (
    <button
      onClick={variant === 'button' ? handleCycleTheme : () => handleToggle(!isDarkMode)}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-md border transition-all duration-300 ease-in-out',
        'hover:bg-accent hover:scale-105 hover:shadow-md hover:border-primary/20',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'focus-visible:ring-4 focus-visible:ring-offset-4', // Enhanced focus ring
        'active:scale-95 active:shadow-sm',
        'group relative overflow-hidden',
        variant === 'compact' && 'px-2 py-1 text-xs',
        className
      )}
      aria-label={
        variant === 'button' 
          ? `Current theme: ${getCurrentThemeLabel()}. Click to cycle themes.`
          : `Switch to ${isDarkMode ? 'light' : 'dark'} mode`
      }
      aria-describedby={variant === 'button' ? 'button-theme-description' : 'toggle-theme-description'}
      title={`Current: ${getCurrentThemeLabel()}`}
      role="button"
      tabIndex={0}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out" />
      
      <IconComponent 
        className={cn(
          'transition-all duration-300 ease-in-out relative z-10',
          'group-hover:scale-110 group-active:scale-95',
          variant === 'compact' ? 'size-3' : 'size-4',
          currentTheme === 'light' && 'text-yellow-500 rotate-0 drop-shadow-sm',
          currentTheme === 'dark' && 'text-blue-400 rotate-180 drop-shadow-sm',
          currentTheme === 'system' && 'text-gray-500 scale-110 drop-shadow-sm'
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={cn(
          'font-medium transition-all duration-300 ease-in-out relative z-10',
          'group-hover:text-foreground',
          variant === 'compact' ? 'text-xs' : 'text-sm'
        )}>
          {variant === 'compact' ? currentTheme.charAt(0).toUpperCase() : getCurrentThemeLabel()}
        </span>
      )}
      <span 
        id={variant === 'button' ? 'button-theme-description' : 'toggle-theme-description'} 
        className="sr-only"
      >
        {variant === 'button' 
          ? 'Cycles through available theme options. Use Enter or Space to activate.'
          : 'Toggles between light and dark themes. Use Enter or Space to activate.'
        }
      </span>
    </button>
  );
}

// ThemeState interface is already exported above