"use client";

import React from "react";
import { Feedback } from "@/features/shared/feedback";
import { Theme } from "@/features/shared/theme";
import dynamic from "next/dynamic";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useHydrated } from "@/api/queries";
import { DecksIntro } from "@/app/decks/_components/decks-intro";

function DecksLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="spinner mb-4" />
        <p>Loading Decks...</p>
      </div>
    </div>
  );
}

const Decks = dynamic(
  () => import("@/app/decks/_components").then((m) => ({ default: m.Decks })),
  {
    ssr: false,
    loading: DecksLoader
  }
);

export function DecksPage() {
  const { activeUser } = useActiveAccount();
  const hydrated = useHydrated();

  return (
    <div className="mb-24 md:mb-0 p-0 m-0 mw-full">
      <Theme />
      <Feedback />
      <div id="deck-media-view-container" />
      {/* Avoid flashing the logged-out intro to logged-in users before the
          client store hydrates; the deck surface is client-only anyway. */}
      {!hydrated ? <DecksLoader /> : activeUser ? <Decks /> : <DecksIntro />}
    </div>
  );
}
