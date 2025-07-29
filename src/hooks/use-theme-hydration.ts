'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

export interface ThemeHydrationState {
  mounted: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  theme: string | undefined;
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;
}

/**
 * Custom hook for optimized theme hydration handling
 * Prevents flash of incorrect theme and provides loading states
 */
export function useThemeHydration(): ThemeHydrationState {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasHydrated, setHasHydrated] = React.useState(false);

  // Handle initial mount and hydration
  React.useEffect(() => {
    setMounted(true);
    
    // Small delay to ensure theme is properly resolved
    const timer = setTimeout(() => {
      setIsLoading(false);
      setHasHydrated(true);
    }, 50); // Minimal delay for smooth transition

    return () => clearTimeout(timer);
  }, []);

  // Track theme changes for performance monitoring
  React.useEffect(() => {
    if (mounted && theme) {
      // Optional: Add performance tracking here
      const startTime = performance.now();
      
      // Use requestAnimationFrame for smooth transitions
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log performance in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Theme change took ${duration.toFixed(2)}ms`);
        }
      });
    }
  }, [theme, mounted]);

  return {
    mounted,
    isLoading,
    hasHydrated,
    theme,
    resolvedTheme,
    setTheme
  };
}