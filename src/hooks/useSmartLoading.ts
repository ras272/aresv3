'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSmartLoadingOptions {
  minLoadingTime?: number; // Tiempo mínimo de loading para evitar flashes
  timeout?: number; // Timeout para operaciones
  retryAttempts?: number; // Intentos de retry automático
}

interface SmartLoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  hasTimedOut: boolean;
}

export function useSmartLoading(options: UseSmartLoadingOptions = {}) {
  const {
    minLoadingTime = 300, // 300ms mínimo para evitar flashes
    timeout = 10000, // 10s timeout
    retryAttempts = 2
  } = options;

  const [state, setState] = useState<SmartLoadingState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    hasTimedOut: false
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();

  const execute = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    customErrorMessage?: string
  ): Promise<T | null> => {
    // Reset state
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      hasTimedOut: false
    }));

    startTimeRef.current = Date.now();

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        hasTimedOut: true,
        error: 'La operación tardó demasiado tiempo'
      }));
    }, timeout);

    try {
      const result = await asyncFn();
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Ensure minimum loading time
      const elapsedTime = Date.now() - (startTimeRef.current || 0);
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      await new Promise(resolve => setTimeout(resolve, remainingTime));

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        retryCount: 0
      }));

      return result;
    } catch (error) {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const errorMessage = customErrorMessage || 
        (error instanceof Error ? error.message : 'Error desconocido');

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }));

      return null;
    }
  }, [minLoadingTime, timeout]);

  const retry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    customErrorMessage?: string
  ): Promise<T | null> => {
    if (state.retryCount >= retryAttempts) {
      setState(prev => ({
        ...prev,
        error: 'Se agotaron los intentos de reconexión'
      }));
      return null;
    }

    return execute(asyncFn, customErrorMessage);
  }, [execute, state.retryCount, retryAttempts]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      isLoading: false,
      error: null,
      retryCount: 0,
      hasTimedOut: false
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    canRetry: state.retryCount < retryAttempts && !state.isLoading
  };
}

// Hook específico para operaciones de ARES
export function useAresOperation() {
  const smartLoading = useSmartLoading({
    minLoadingTime: 500, // Un poco más para operaciones de ARES
    timeout: 15000, // 15s para operaciones de base de datos
    retryAttempts: 3
  });

  const executeWithToast = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ): Promise<T | null> => {
    const { loading = 'Procesando...', success, error: errorMsg } = messages;

    // Mostrar toast de loading si es necesario
    if (loading) {
      // Aquí podrías integrar con tu sistema de toast
      console.log(loading);
    }

    const result = await smartLoading.execute(asyncFn, errorMsg);

    if (result && success) {
      // Toast de éxito
      console.log(success);
    }

    return result;
  }, [smartLoading]);

  return {
    ...smartLoading,
    executeWithToast
  };
}
