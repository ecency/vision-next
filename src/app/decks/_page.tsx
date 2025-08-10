"use client";

import React from "react";
import { Feedback, Theme } from "@/features/shared";
import { Decks } from "@/app/decks/_components";

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
