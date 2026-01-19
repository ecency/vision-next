'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect WebP image format support in the browser.
 *
 * @returns Whether the browser supports WebP images
 *
 * @example
 * ```tsx
 * function MyImage({ src }: { src: string }) {
 *   const supportsWebp = useWebpSupport();
 *   const imageUrl = supportsWebp ? `${src}.webp` : `${src}.jpg`;
 *   return <img src={imageUrl} />;
 * }
 * ```
 */
export function useWebpSupport(): boolean {
  const [supportsWebp, setSupportsWebp] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    const isSupported =
      canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    setSupportsWebp(isSupported);
  }, []);

  return supportsWebp;
}

export default useWebpSupport;
