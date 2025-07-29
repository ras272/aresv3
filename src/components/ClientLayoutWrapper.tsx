'use client';

import { AppInitializer } from './AppInitializer';
import { HydrationErrorBoundary } from './HydrationErrorBoundary';
import { AuthGuard } from './AuthGuard';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  return (
    <HydrationErrorBoundary>
      <AppInitializer />
      <AuthGuard>
        {children}
      </AuthGuard>
    </HydrationErrorBoundary>
  );
} 