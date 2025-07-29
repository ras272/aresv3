import { useEffect, useLayoutEffect } from 'react';

/**
 * Hook that uses useLayoutEffect on the client and useEffect on the server.
 * Prevents hydration warnings when using layout effects.
 */
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;