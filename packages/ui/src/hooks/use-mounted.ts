'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to track if the component has mounted on the client.
 * Useful for SSR/hydration scenarios where you need to render
 * differently on client vs server.
 *
 * @returns Whether the component has mounted
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hasMounted = useMounted();
 *
 *   // Return placeholder during SSR
 *   if (!hasMounted) {
 *     return <div className="placeholder" />;
 *   }
 *
 *   // Render full content on client
 *   return <div>{window.location.href}</div>;
 * }
 * ```
 */
export function useMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}

export default useMounted;
