'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function AppInitializer() {
  const { setHydrated, isHydrated, loadAllData } = useAppStore();
  const initializationRef = useRef(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Evitar inicialización múltiple
      if (initializationRef.current) return;
      initializationRef.current = true;

      try {
        // 1. Marcar como hidratado
        if (!isHydrated) {
          setHydrated();
          console.log('✅ Store hidratado correctamente');
        }

        // 2. Cargar todos los datos desde Supabase
        console.log('🔄 Cargando datos desde Supabase...');
        await loadAllData();
        console.log('✅ Datos cargados exitosamente');
        
      } catch (error) {
        console.error('❌ Error inicializando la aplicación:', error);
      }
    };

    initializeApp();
  }, []); // Solo una vez al montar

  return null; // Este componente no renderiza nada visible
} 