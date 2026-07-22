'use client';

import { ErrorMessage as BaseErrorMessage } from '@ecency/ui';
import { UilExclamationTriangle } from '@tooni/iconscout-unicons-react';
import { t } from '@/core';

interface Props {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

function ErrorIcon({ className }: { className?: string }) {
  return <UilExclamationTriangle className={className ?? "size-12"} />;
}

export function ErrorMessage({ message, onRetry, className }: Props) {
  return (
    <BaseErrorMessage
      message={message || t('error_loading')}
      onRetry={onRetry}
      className={className}
      retryText={t('retry')}
      icon={<ErrorIcon className="size-12 text-red-500 mb-4" />}
    />
  );
}
