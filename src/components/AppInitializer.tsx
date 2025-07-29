'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function AppInitializer() {
  const { loadAllData, setHydrated, isHydrated } = useAppStore();

  useEffect(() => {
    // ✅ FIXED: Mark store as hydrated first to prevent hydration errors
    if (!isHydrated) {
      setHydrated();
    }
    
    console.log('🚀 Inicializando datos desde Supabase...');
    
    // Load data after hydration is complete
    loadAllData().catch(error => {
      console.warn('⚠️ Error cargando datos de Supabase:', error);
      console.log('💡 Usando datos de ejemplo como respaldo');
    });
  }, [loadAllData, setHydrated, isHydrated]);

  return null; // Este componente no renderiza nada visible
} 