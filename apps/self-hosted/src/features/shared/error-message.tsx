'use client';

import { UilExclamationTriangle } from '@tooni/iconscout-unicons-react';
import clsx from 'clsx';
import { t } from '@/core';

interface Props {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onRetry, className }: Props) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 px-4', className)}>
      <UilExclamationTriangle className="w-12 h-12 text-red-500 mb-4" />
      <p className="text-theme-muted text-center mb-4">
        {message || t('error_loading')}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          {t('retry')}
        </button>
      )}
    </div>
  );
}
