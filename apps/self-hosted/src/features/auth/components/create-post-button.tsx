'use client';

import { UilPen } from '@tooni/iconscout-unicons-react';
import clsx from 'clsx';
import { useIsBlogOwner, useIsAuthEnabled } from '../hooks';
import { t } from '@/core';

interface CreatePostButtonProps {
  className?: string;
}

export function CreatePostButton({ className }: CreatePostButtonProps) {
  const isBlogOwner = useIsBlogOwner();
  const isAuthEnabled = useIsAuthEnabled();

  // Only show for blog owner when auth is enabled
  if (!isAuthEnabled || !isBlogOwner) {
    return null;
  }

  return (
    <a
      href="https://ecency.com/submit"
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-md',
        'bg-blue-600 text-white hover:bg-blue-700 transition-colors',
        'text-sm font-medium',
        className
      )}
    >
      <UilPen className="w-4 h-4" />
      <span className="hidden sm:inline">{t('create_post')}</span>
    </a>
  );
}
