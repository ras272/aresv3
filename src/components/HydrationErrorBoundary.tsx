'use client';

import React from 'react';

interface HydrationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface HydrationErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Error boundary specifically for hydration errors.
 * Provides graceful fallback when hydration fails.
 */
export class HydrationErrorBoundary extends React.Component<
  HydrationErrorBoundaryProps,
  HydrationErrorBoundaryState
> {
  constructor(props: HydrationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): HydrationErrorBoundaryState {
    // Check if it's a hydration error
    const isHydrationError = 
      error.message.includes('Hydration') ||
      error.message.includes('hydration') ||
      error.message.includes('server HTML') ||
      error.message.includes('client-side');

    return {
      hasError: isHydrationError,
      error: isHydrationError ? error : undefined
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log hydration errors in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Hydration Error Detected');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI for hydration errors
      return (
        this.props.fallback || (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
              <p className="text-yellow-800 font-medium">
                Cargando contenido...
              </p>
            </div>
            <p className="text-yellow-600 text-sm mt-1">
              El contenido se está sincronizando entre el servidor y el cliente.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}