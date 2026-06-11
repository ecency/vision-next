"use client";

import i18next from "i18next";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";

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

export interface TurnstileHandle {
  /** Discard the current (single-use) token and request a fresh challenge. */
  reset: () => void;
}

interface Props {
  sitekey: string;
  /** Called with the verification token when the challenge is solved. */
  onVerify: (token: string) => void;
  /** Called when the token expires or the widget is reset — clear stored token. */
  onExpire?: () => void;
  /** Called when the challenge errors or the script fails to load. Falls back to onExpire when omitted. */
  onError?: () => void;
  className?: string;
}

export const Turnstile = forwardRef<TurnstileHandle, Props>(function Turnstile(
  { sitekey, onVerify, onExpire, onError, className },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Hold the latest callbacks in refs so the widget is rendered once (stable) but
  // always invokes the current props — safe even if a caller passes inline callbacks.
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  const [failedToLoad, setFailedToLoad] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch {
            // widget already gone
          }
        }
        onExpireRef.current?.();
      }
    }),
    []
  );

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          callback: (token: string) => onVerifyRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => (onErrorRef.current ?? onExpireRef.current)?.()
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFailedToLoad(true);
          (onErrorRef.current ?? onExpireRef.current)?.();
        }
      });

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
  }, [sitekey]);

  if (failedToLoad) {
    return (
      <div className={className}>
        <small className="text-red">{i18next.t("sign-up.captcha-load-failed")}</small>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
});
