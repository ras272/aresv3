'use client';

import { AppInitializer } from './AppInitializer';
import { HydrationErrorBoundary } from './HydrationErrorBoundary';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AuthProvider } from './auth/AuthProvider';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  return (
    <HydrationErrorBoundary>
      <AuthProvider>
        <AppInitializer />
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </AuthProvider>
    </HydrationErrorBoundary>
  );
} 