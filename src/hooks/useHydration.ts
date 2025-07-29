'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect when the component has hydrated on the client.
 * Useful for preventing hydration mismatches.
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook to safely get the current date, avoiding hydration mismatches.
 * Returns null on server, actual date on client after hydration.
 */
export function useSafeDate() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const isHydrated = useHydration();

  useEffect(() => {
    if (isHydrated) {
      setCurrentDate(new Date());
    }
  }, [isHydrated]);

  return {
    currentDate,
    isHydrated,
    // Helper to get today's date string safely
    getTodayString: () => {
      if (!currentDate) return '';
      return currentDate.toISOString().split('T')[0];
    },
    // Helper to get current month start safely
    getMonthStartString: () => {
      if (!currentDate) return '';
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      return monthStart.toISOString().split('T')[0];
    }
  };
}