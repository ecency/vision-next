'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Size } from '../../types';

export interface UserAvatarProps {
  /** Hive username */
  username: string;
  /** Avatar size variant */
  size?: Size | 'normal' | 'sLarge' | 'xLarge' | 'deck-item';
  /** Custom image source (overrides default avatar URL) */
  src?: string;
  /** Base URL for image proxy (default: https://images.ecency.com) */
  imageProxyBase?: string;
  /** Click handler - makes avatar interactive */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses: Record<string, string> = {
  xsmall: 'w-4 h-4',
  small: 'w-6 h-6',
  normal: 'w-7 h-7',
  medium: 'w-10 h-10',
  sLarge: 'w-14 h-14',
  large: 'w-20 h-20',
  xlarge: 'w-[120px] h-[120px]',
  xLarge: 'w-[120px] h-[120px]',
  'deck-item': 'w-9 h-9',
};

const sizeToApiSize: Record<string, 'small' | 'medium' | 'large'> = {
  xsmall: 'small',
  small: 'small',
  normal: 'small',
  medium: 'medium',
  sLarge: 'medium',
  large: 'large',
  xlarge: 'large',
  xLarge: 'large',
  'deck-item': 'small',
};

const DEFAULT_IMAGE_PROXY = 'https://images.ecency.com';

/**
 * UserAvatar displays a Hive user's profile avatar image.
 *
 * Features:
 * - Automatic WebP detection and usage when supported
 * - Configurable image proxy
 * - Multiple size variants
 * - Accessible (keyboard navigation, ARIA labels)
 * - SSR-safe with hydration handling
 *
 * @example
 * ```tsx
 * // Basic usage
 * <UserAvatar username="ecency" />
 *
 * // With click handler
 * <UserAvatar username="ecency" size="large" onClick={() => navigate('/profile')} />
 *
 * // Custom proxy
 * <UserAvatar username="ecency" imageProxyBase="https://my-proxy.com" />
 * ```
 */
export function UserAvatar({
  username,
  size = 'medium',
  src,
  imageProxyBase = DEFAULT_IMAGE_PROXY,
  onClick,
  className,
}: UserAvatarProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [canUseWebp, setCanUseWebp] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Check if browser supports WebP
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        const dataUrl = canvas.toDataURL('image/webp');
        setCanUseWebp(dataUrl?.indexOf('data:image/webp') === 0);
      } catch {
        setCanUseWebp(false);
      }
    }
  }, []);

  const apiSize = useMemo(() => sizeToApiSize[size] || 'medium', [size]);

  const imageSrc = useMemo(() => {
    // If custom src provided, use it directly
    if (src) {
      return src;
    }

    // Build avatar URL from image proxy
    const useWebp = hasMounted && canUseWebp;
    const webpPath = useWebp ? '/webp' : '';
    return `${imageProxyBase}${webpPath}/u/${username}/avatar/${apiSize}`;
  }, [src, imageProxyBase, username, apiSize, canUseWebp, hasMounted]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  const sizeClass = sizeClasses[size] || sizeClasses.medium;

  return (
    <span
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={clsx(
        'inline-block rounded-full bg-gray-300 dark:bg-gray-700 bg-cover bg-center bg-no-repeat shrink-0',
        sizeClass,
        onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
      style={{
        backgroundImage: `url(${imageSrc})`,
      }}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${username}'s avatar`}
    />
  );
}

export default UserAvatar;
