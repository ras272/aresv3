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
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
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
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

// Hook específico para ARES - detecta si Javier está en campo
export function useFieldMode() {
  const device = useDevice();
  const [isFieldMode, setIsFieldMode] = useState(false);

  useEffect(() => {
    // Activar modo campo si:
    // 1. Es móvil Y es touch device
    // 2. O si está en orientación portrait en tablet
    const shouldActivateFieldMode = 
      (device.isMobile && device.isTouchDevice) ||
      (device.isTablet && device.orientation === 'portrait');

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
