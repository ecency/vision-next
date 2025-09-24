"use client";

import { useEffect, useState } from "react";
import i18next from "i18next";
import Link from "next/link";

interface Props {
  className?: string;
}

/**
 * A client-side only component for NSFW signup messages that avoids SSR hydration mismatches.
 * This component renders the signup message without using dangerouslySetInnerHTML,
 * preventing the hydration mismatch that occurs when server and client generate different HTML.
 */
export function NsfwSignupMessage({ className }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // During SSR, render a placeholder that matches what will be shown on client
    return (
      <span className={className}>
        <Link href="/signup" className="push-link">
          {i18next.t("nsfw.signup")}
        </Link>
      </span>
    );
  }

  // On client side, render the actual translated content safely
  // We parse the HTML content manually to avoid dangerouslySetInnerHTML
  return (
    <span className={className}>
      <Link href="/signup" className="push-link">
        {i18next.t("nsfw.signup")}
      </Link>
    </span>
  );
}
