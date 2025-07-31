'use client';

import { AppInitializer } from './AppInitializer';
import { HydrationErrorBoundary } from './HydrationErrorBoundary';
import { ProtectedRoute } from './auth/ProtectedRoute';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  return (
    <HydrationErrorBoundary>
      <AppInitializer />
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </HydrationErrorBoundary>
  );
} 