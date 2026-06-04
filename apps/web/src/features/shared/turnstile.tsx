"use client";

import React, { useEffect, useRef } from "react";

// Cloudflare Turnstile widget. Loads the CF script once and renders an explicit
// widget, no extra npm dependency. The sitekey is public; the secret is verified
// server-side (onboard). Managed mode is configured on the Cloudflare dashboard.
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Failed to load Turnstile"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

interface Props {
  sitekey: string;
  /** Called with the verification token when the challenge is solved. */
  onVerify: (token: string) => void;
  /** Called when the token expires or the widget errors — clear any stored token. */
  onExpire?: () => void;
  className?: string;
}

export function Turnstile({ sitekey, onVerify, onExpire, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          callback: (token: string) => onVerify(token),
          "expired-callback": () => onExpire?.(),
          "error-callback": () => onExpire?.()
        });
      })
      .catch(() => onExpire?.());

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // widget already gone
        }
        widgetIdRef.current = null;
      }
    };
    // sitekey is stable; callbacks intentionally excluded to avoid re-rendering the widget
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitekey]);

  return <div ref={containerRef} className={className} />;
}
