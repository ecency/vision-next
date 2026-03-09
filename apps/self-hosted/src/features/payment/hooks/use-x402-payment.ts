'use client';

import { useCallback, useRef, useState } from 'react';
import {
  parseRequirementsFromResponse,
  type PaymentRequirements,
} from '../x402-client';

interface UseX402PaymentReturn {
  /** Wrapper around fetch that detects 402 responses */
  x402Fetch: (url: string, init?: RequestInit) => Promise<Response>;
  /** True when a payment dialog should be shown */
  isPendingPayment: boolean;
  /** Payment requirements extracted from the 402 response */
  paymentRequirements: PaymentRequirements | null;
  /** Retry the original request with the signed payment header */
  retryWithPayment: (paymentHeader: string) => Promise<Response>;
  /** Cancel the pending payment */
  cancelPayment: () => void;
}

/**
 * React hook for x402 payment flows.
 *
 * Usage:
 *   const { x402Fetch, isPendingPayment, paymentRequirements, retryWithPayment, cancelPayment } = useX402Payment();
 *
 *   // Make a request that might require payment
 *   const response = await x402Fetch('/v1/tenants/subscribe', { method: 'POST', ... });
 *   // If 402, isPendingPayment becomes true and paymentRequirements is populated
 *   // Show dialog, get signed header, then:
 *   const paidResponse = await retryWithPayment(header);
 */
export function useX402Payment(): UseX402PaymentReturn {
  const [isPendingPayment, setIsPendingPayment] = useState(false);
  const [paymentRequirements, setPaymentRequirements] =
    useState<PaymentRequirements | null>(null);

  // Store the original request info for retry
  const pendingRequest = useRef<{ url: string; init?: RequestInit } | null>(null);

  const x402Fetch = useCallback(
    async (url: string, init?: RequestInit): Promise<Response> => {
      const response = await fetch(url, init);

      if (response.status === 402) {
        const requirements = await parseRequirementsFromResponse(response.clone());
        if (requirements) {
          pendingRequest.current = { url, init };
          setPaymentRequirements(requirements);
          setIsPendingPayment(true);
          return response;
        }
      }

      return response;
    },
    []
  );

  const retryWithPayment = useCallback(
    async (paymentHeader: string): Promise<Response> => {
      const req = pendingRequest.current;
      if (!req) {
        throw new Error('No pending request to retry');
      }

      const headers = new Headers(req.init?.headers);
      headers.set('x-payment', paymentHeader);

      const response = await fetch(req.url, {
        ...req.init,
        headers,
      });

      // If the retry itself returns 402 (e.g., payment expired/invalid),
      // re-enter payment state with fresh requirements
      if (response.status === 402) {
        const requirements = await parseRequirementsFromResponse(response.clone());
        if (requirements) {
          setPaymentRequirements(requirements);
          // pendingRequest stays the same for the next retry
          return response;
        }
      }

      // Non-402 final response — clear state
      pendingRequest.current = null;
      setIsPendingPayment(false);
      setPaymentRequirements(null);

      return response;
    },
    []
  );

  const cancelPayment = useCallback(() => {
    pendingRequest.current = null;
    setIsPendingPayment(false);
    setPaymentRequirements(null);
  }, []);

  return {
    x402Fetch,
    isPendingPayment,
    paymentRequirements,
    retryWithPayment,
    cancelPayment,
  };
}
