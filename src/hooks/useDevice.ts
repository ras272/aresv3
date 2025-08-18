'use client';

import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenWidth: 1920,
    screenHeight: 1080,
    orientation: 'landscape'
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      // ✅ FIXED: Check if window is available to prevent hydration errors
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const isMobile = width < 900; // Ampliado para incluir tablets pequeñas
      const isTablet = width >= 900 && width < 1200;
      const isDesktop = width >= 1200;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const orientation = width > height ? 'landscape' : 'portrait';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
        orientation
      });
    };

    // Initial check
    updateDeviceInfo();

    // Listen for resize events
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateDeviceInfo);
      window.addEventListener('orientationchange', updateDeviceInfo);

      return () => {
        window.removeEventListener('resize', updateDeviceInfo);
        window.removeEventListener('orientationchange', updateDeviceInfo);
      };
    }
  }, []);

  return deviceInfo;
}

// Hook específico para ARES - detecta si Javier está en campo
export function useFieldMode() {
  const device = useDevice();
  const [isFieldMode, setIsFieldMode] = useState(false);

  useEffect(() => {
    // Activar modo campo si:
    // 1. Es móvil (ancho < 900px) - MÁS AGRESIVO
    // 2. O si es tablet en portrait
    // 3. O si la pantalla es táctil y menor a 1000px
    const shouldActivateFieldMode = 
      device.isMobile || // Cualquier pantalla < 900px
      (device.isTablet && device.orientation === 'portrait') ||
      (device.isTouchDevice && device.screenWidth < 1000); // Táctil < 1000px

    setIsFieldMode(shouldActivateFieldMode);
  }, [device]);

  return {
    ...device,
    isFieldMode,
    // Configuraciones específicas para modo campo
    fieldConfig: {
      buttonSize: isFieldMode ? 'lg' : 'md',
      cardPadding: isFieldMode ? 'p-4' : 'p-6',
      fontSize: isFieldMode ? 'text-base' : 'text-sm',
      touchTargetSize: isFieldMode ? 'min-h-12' : 'min-h-8'
    }
  };
}
