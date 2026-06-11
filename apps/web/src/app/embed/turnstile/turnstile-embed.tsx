"use client";

import React, { useEffect } from "react";
import { Turnstile } from "@/features/shared/turnstile";
import { AppWindow } from "@/types";

// Public Cloudflare Turnstile sitekey (Managed mode). The token is verified
// server-side (onboard); the secret never reaches the client.
const TURNSTILE_SITEKEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || "0x4AAAAAADe6jH7FIi9dBzgR";

type BridgeMessage = { type: "verify"; token: string } | { type: "expire" } | { type: "error" };

function postToApp(message: BridgeMessage) {
  const w = window as unknown as AppWindow;
  w.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

/**
 * Standalone Turnstile widget, rendered as a top-level page so the mobile app's
 * WebView can load it from a real ecency.com URL. Loading a hosted page (instead
 * of injecting an HTML string with a faked baseUrl) gives the widget a genuine
 * first-party origin and storage partition — which the Managed challenge needs to
 * complete. An inline-HTML WebView stalls on "Verifying…" indefinitely. The token
 * is bridged back to React Native via window.ReactNativeWebView.postMessage; the
 * native side passes it to signUp() and verifies it server-side.
 */
export function TurnstileEmbed() {
  // The native WebView is transparent; drop the inherited page background so the
  // widget blends with the modal that hosts it.
  useEffect(() => {
    const { documentElement, body } = document;
    const prevHtml = documentElement.style.background;
    const prevBody = body.style.background;
    documentElement.style.background = "transparent";
    body.style.background = "transparent";
    return () => {
      documentElement.style.background = prevHtml;
      body.style.background = prevBody;
    };
  }, []);

  return (
    <div className="flex items-center justify-center w-full min-h-[76px] p-1">
      <Turnstile
        sitekey={TURNSTILE_SITEKEY}
        onVerify={(token) => postToApp({ type: "verify", token })}
        onExpire={() => postToApp({ type: "expire" })}
        onError={() => postToApp({ type: "error" })}
      />
    </div>
  );
}
