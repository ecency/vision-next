"use client";

import React from "react";
import { Feedback, Theme } from "@/features/shared";
import dynamic from "next/dynamic";

const Decks = dynamic(
  () => import("@/app/decks/_components").then((m) => ({ default: m.Decks })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p>Loading Decks...</p>
        </div>
      </div>
    )
  }
);

export function DecksPage() {
  return (
    <div className="mb-24 md:mb-0 p-0 m-0 mw-full">
      <Theme />
      <Feedback />
      <div id="deck-media-view-container" />
      <Decks />
    </div>
  );
}
