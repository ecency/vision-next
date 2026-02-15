'use client';

import { useRef, useState } from 'react';
import { UilDollarSign } from '@tooni/iconscout-unicons-react';
import { useTippingConfig } from '../hooks/use-tipping-config';
import { TippingPopover } from './tipping-popover';
import type { TippingVariant } from '../types';

interface TipButtonProps {
  recipientUsername: string;
  variant: TippingVariant;
  memo?: string;
  className?: string;
}

export function TipButton({
  recipientUsername,
  variant,
  memo = '',
  className,
}: TipButtonProps) {
  const { enabled, buttonLabel, presetAmounts } = useTippingConfig(variant);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | undefined>(undefined);

  if (!enabled) return undefined;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={className}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <UilDollarSign className="w-4 h-4" />
        <span>{buttonLabel}</span>
      </button>
      {open && (
        <TippingPopover
          to={recipientUsername}
          memo={memo}
          presetAmounts={presetAmounts}
          onClose={() => setOpen(false)}
          anchorRef={anchorRef}
        />
      )}
    </>
  );
}
