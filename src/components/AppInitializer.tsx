'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function AppInitializer() {
  const loadAllData = useAppStore(state => state.loadAllData);

  useEffect(() => {
    console.log('🚀 Inicializando datos desde Supabase...');
    
    // ✅ REACTIVADO - Tu Supabase está funcionando perfectamente
    loadAllData().catch(error => {
      console.warn('⚠️ Error cargando datos de Supabase:', error);
      console.log('💡 Usando datos de ejemplo como respaldo');
    });
  }, [loadAllData]);

  return null; // Este componente no renderiza nada visible
} 