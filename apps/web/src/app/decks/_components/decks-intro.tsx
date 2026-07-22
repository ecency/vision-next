"use client";

import React from "react";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { UilColumns } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { useGlobalStore } from "@/core/global-store";
import { DECKS_INTRO_FEATURES } from "./decks-intro-features";

/**
 * Logged-out landing for /decks. A logged-out visitor cannot save decks or use
 * the account-scoped columns (notifications, wallet, waves), so instead of
 * dropping them into the raw, contextless deck surface we explain what Decks is
 * and route them to log in or browse communities. Logged-in users never see
 * this — `_page.tsx` renders the deck surface for them.
 */
export function DecksIntro() {
  const router = useRouter();
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
      <div className="w-full max-w-[640px] flex flex-col items-center gap-8 text-center">
        <div className="flex items-center justify-center size-16 rounded-2xl bg-blue-duck-egg text-blue-dark-sky dark:bg-dark-default">
          <UilColumns className="size-8" />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold">{i18next.t("decks.intro.title")}</h1>
          <p className="opacity-75 max-w-[480px] mx-auto">
            {i18next.t("decks.intro.description")}
          </p>
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
          {DECKS_INTRO_FEATURES.map(({ icon, key }) => (
            <div
              className="grid gap-4 items-start"
              key={key}
              style={{ gridTemplateColumns: "max-content 1fr" }}
            >
              {icon}
              <div className="-mt-1">
                <div className="font-bold">{i18next.t(`decks.intro.features.${key}-title`)}</div>
                <div className="opacity-75 text-sm">
                  {i18next.t(`decks.intro.features.${key}-description`)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Button size="lg" onClick={() => toggleUiProp("login", true)}>
            {i18next.t("decks.intro.login")}
          </Button>
          <Button size="lg" appearance="gray-link" onClick={() => router.push("/communities")}>
            {i18next.t("decks.intro.browse-communities")}
          </Button>
        </div>
      </div>
    </div>
  );
}
