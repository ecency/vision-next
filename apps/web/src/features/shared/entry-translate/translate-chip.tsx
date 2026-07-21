"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import i18next from "i18next";
import { UilLanguage } from "@tooni/iconscout-unicons-react";
import { Entry } from "@/entities";
import { useContentLanguageGate } from "./use-content-language-gate";
import { languageDisplayName } from "./iso639";

const EntryTranslate = dynamic(
  () => import("./index").then((m) => ({ default: m.EntryTranslate })),
  { ssr: false }
);

interface Props {
  entry: Entry;
  className?: string;
}

/**
 * Compact "Translate" chip for feed list items and waves, shown only when the
 * detected content language differs from the reader's. Feed-safe by design:
 *  - detection is franc-only (NO server /detect), so no per-item network;
 *  - the gate is idle-scheduled and memoized per-permlink at module scope;
 *  - it must be placed inside a near-viewport-hydrated island so off-screen
 *    cards never run detection at all.
 *
 * Tapping opens the existing translate modal pre-targeted to the reader's
 * language (source stays "auto" so LibreTranslate — not the coarse franc guess
 * — decides the real source language). The 3-dot Translate item stays as a
 * fallback for everything else.
 */
export function TranslateChip({ entry, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const decision = useContentLanguageGate(entry, { serverConfirm: false });

  if (!decision?.show) {
    return null;
  }

  const targetName = languageDisplayName(decision.target, i18next.language);

  return (
    <>
      <button
        type="button"
        className={`flex items-center gap-1 text-gray-steel hover:text-blue-dark-sky ${className}`}
        onClick={() => setOpen(true)}
        title={i18next.t("entry-translate.translate-to", { lang: targetName })}
        aria-label={i18next.t("entry-translate.translate-to", { lang: targetName })}
      >
        <UilLanguage className="size-3.5" />
        <span>{i18next.t("entry-menu.translate")}</span>
      </button>
      {open && (
        <EntryTranslate
          entry={entry}
          initialTarget={decision.target}
          onHide={() => setOpen(false)}
        />
      )}
    </>
  );
}
