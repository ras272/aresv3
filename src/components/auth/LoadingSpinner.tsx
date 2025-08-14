'use client';

import React from 'react';
import Image from 'next/image';

/**
 * Loading spinner props
 */
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showLogo?: boolean;
}

/**
 * Loading spinner component for authentication states
 */
export function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  showLogo = true 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const logoSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {showLogo && (
        <div className="mb-6">
          <div className={`${logoSizeClasses[size]} mx-auto mb-4 flex items-center justify-center rounded-xl bg-white shadow-lg animate-pulse`}>
            <Image 
              src="/isologo-ares.png" 
              alt="Ares Paraguay Logo" 
              width={size === 'lg' ? 64 : size === 'md' ? 48 : 32}
              height={size === 'lg' ? 64 : size === 'md' ? 48 : 32}
              className="object-contain"
            />
          </div>
        </div>
      )}
      
      <div className="text-center">
        <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4`}></div>
        
        {message && (
          <p className="text-muted-foreground text-sm font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Full screen loading overlay
 */
interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

export function LoadingOverlay({ message = 'Loading...', isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
        <LoadingSpinner message={message} size="lg" />
      </div>
    </div>
  );
}

/**
 * Inline loading spinner (smaller, for use within components)
 */
interface InlineLoadingProps {
  message?: string;
  className?: string;
}

export function InlineLoading({ message, className = '' }: InlineLoadingProps) {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

/**
 * Button loading spinner (for use in buttons)
 */
interface ButtonLoadingProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function ButtonLoading({ size = 'sm', className = '' }: ButtonLoadingProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className={`${sizeClass} border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}></div>
  );
}