import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { createMemoizedSelector } from './performance-optimization';

/**
 * Custom hook for debouncing values to prevent excessive re-renders
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttling function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Custom hook for memoizing expensive computations
 */
export function useExpensiveComputation<T>(
  computeFn: () => T,
  deps: React.DependencyList
): T {
  return useMemo(() => {
    const startTime = performance.now();
    const result = computeFn();
    const endTime = performance.now();
    
    if (endTime - startTime > 16) { // More than one frame (16ms)
      console.warn(`Expensive computation took ${endTime - startTime}ms`);
    }
    
    return result;
  }, deps);
}

/**
 * Custom hook for optimized state updates
 */
export function useOptimizedState<T>(
  initialValue: T,
  equalityFn?: (a: T, b: T) => boolean
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  
  const optimizedSetState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newState = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value;
      
      // Use custom equality function if provided
      if (equalityFn) {
        return equalityFn(prevState, newState) ? prevState : newState;
      }
      
      // Default shallow comparison for objects
      if (typeof newState === 'object' && newState !== null && typeof prevState === 'object' && prevState !== null) {
        const prevKeys = Object.keys(prevState);
        const newKeys = Object.keys(newState);
        
        if (prevKeys.length !== newKeys.length) {
          return newState;
        }
        
        for (const key of prevKeys) {
          if ((prevState as any)[key] !== (newState as any)[key]) {
            return newState;
          }
        }
        
        return prevState; // No changes detected
      }
      
      return prevState === newState ? prevState : newState;
    });
  }, [equalityFn]);
  
  return [state, optimizedSetState];
}

/**
 * Custom hook for preventing unnecessary re-renders of child components
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);
  
  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Custom hook for lazy loading components
 */
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    importFn()
      .then(module => {
        if (mounted) {
          setComponent(() => module.default);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });
    
    return () => {
      mounted = false;
    };
  }, [importFn]);
  
  return { Component, loading, error };
}

/**
 * Custom hook for virtual scrolling optimization
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange
  };
}

/**
 * Custom hook for intersection observer (lazy loading images, etc.)
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);
  
  const ref = useCallback((node: Element | null) => {
    setElement(node);
  }, []);
  
  useEffect(() => {
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [element, options]);
  
  return [ref, isIntersecting];
}

/**
 * Custom hook for optimized form handling
 */
export function useOptimizedForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: (values: T) => Record<keyof T, string | undefined>
) {
  const [values, setValues] = useOptimizedState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  
  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors, setValues]);
  
  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);
  
  const validate = useCallback(() => {
    if (!validationSchema) return true;
    
    const newErrors = validationSchema(values);
    setErrors(newErrors);
    
    return Object.values(newErrors).every(error => !error);
  }, [values, validationSchema]);
  
  const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);
      setTouched(allTouched);
      
      if (validate()) {
        await onSubmit(values);
      }
    };
  }, [values, validate]);
  
  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    handleSubmit,
    isValid: Object.values(errors).every(error => !error)
  };
}

/**
 * Higher-order component for React.memo with custom comparison
 */
export function createMemoComponent<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, areEqual);
}

/**
 * Utility for creating optimized selectors for state management
 */
export function createOptimizedSelector<State, Result>(
  selector: (state: State) => Result,
  equalityFn?: (a: Result, b: Result) => boolean
) {
  return createMemoizedSelector(selector, equalityFn);
}

/**
 * Performance monitoring for React components
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return React.memo((props: P) => {
    const renderStart = useRef<number>(0);
    const renderCount = useRef<number>(0);
    
    useEffect(() => {
      renderStart.current = performance.now();
      renderCount.current++;
    });
    
    useEffect(() => {
      const renderTime = performance.now() - renderStart.current;
      
      if (renderTime > 16) { // More than one frame
        console.warn(
          `[PERFORMANCE] ${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms`
        );
      }
      
      if (renderCount.current > 10 && renderCount.current % 10 === 0) {
        console.info(
          `[PERFORMANCE] ${componentName} has rendered ${renderCount.current} times`
        );
      }
    });
    
    return React.createElement(Component, props);
  });
}

