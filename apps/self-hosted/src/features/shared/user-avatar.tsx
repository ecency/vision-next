'use client';

import { proxifyImageSrc } from '@ecency/render-helper';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InstanceConfigManager } from '@/core';

interface Props {
  username: string;
  size?:
    | 'xsmall'
    | 'small'
    | 'normal'
    | 'medium'
    | 'sLarge'
    | 'large'
    | 'xLarge'
    | 'deck-item';
  src?: string;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  xsmall: 'w-4 h-4',
  small: 'w-6 h-6',
  normal: 'w-7 h-7',
  medium: 'w-10 h-10',
  sLarge: 'w-14 h-14',
  large: 'w-20 h-20',
  xLarge: 'w-[120px] h-[120px]',
  'deck-item': 'w-9 h-9',
};

const sizeMap: Record<string, 'small' | 'medium' | 'large'> = {
  xLarge: 'large',
  normal: 'small',
  small: 'small',
  sLarge: 'medium',
  medium: 'medium',
  large: 'large',
  xsmall: 'small',
  'deck-item': 'small',
};

export function UserAvatar({
  username,
  size = 'medium',
  src,
  onClick,
  className,
}: Props) {
  const [hasMounted, setHasMounted] = useState(false);
  const [canUseWebp, setCanUseWebp] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Check if browser supports WebP
    const canvas = document.createElement('canvas');
    setCanUseWebp(
      canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    );
  }, []);

  const imgSize = useMemo(() => sizeMap[size] || 'medium', [size]);

  const imageSrc = useMemo(() => {
    // Always return a URL, even during SSR/hydration
    // This ensures the avatar shows immediately
    const format = hasMounted && canUseWebp ? 'webp' : 'match';
    const proxyBase = InstanceConfigManager.getConfigValue(
      ({ configuration }) =>
        (configuration.general as Record<string, unknown>).imageProxy as string ||
        'https://images.ecency.com',
    );
    const fallbackUrl = `${proxyBase}${
      format === 'webp' ? '/webp' : ''
    }/u/${username}/avatar/${imgSize}`;

    return proxifyImageSrc(src, 0, 0, format) || fallbackUrl;
  }, [src, imgSize, username, canUseWebp, hasMounted]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  return (
    <span
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={clsx(
        'inline-block rounded-full bg-gray-300 dark:bg-gray-700 bg-cover bg-center bg-no-repeat shrink-0',
        sizeClasses[size],
        onClick && 'cursor-pointer',
        className,
      )}
      style={{
        backgroundImage: `url(${imageSrc})`,
      }}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${username} avatar`}
    />
  );
}
