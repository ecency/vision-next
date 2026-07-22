import React from "react";
import {
  UilCloudComputing,
  UilColumns,
  UilUsersAlt,
  UilWindow
} from "@tooni/iconscout-unicons-react";

/**
 * Feature highlights shared by the logged-out Decks splash (DecksIntro) and the
 * one-time onboarding modal (DecksOnboarding). Titles/descriptions resolve from
 * i18n keys `decks.intro.features.<key>-title` / `-description`.
 */
export const DECKS_INTRO_FEATURES = [
  { icon: <UilColumns className="size-6 opacity-50" />, key: "columns" },
  { icon: <UilUsersAlt className="size-6 opacity-50" />, key: "anything" },
  { icon: <UilWindow className="size-6 opacity-50" />, key: "arrange" },
  { icon: <UilCloudComputing className="size-6 opacity-50" />, key: "saved" }
] as const;
