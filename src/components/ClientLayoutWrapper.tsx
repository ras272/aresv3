'use client';

import { AppInitializer } from './AppInitializer';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  return (
    <>
      <AppInitializer />
      {children}
    </>
  );
} 