"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import i18next from "i18next";
import { postBodySummary } from "@ecency/render-helper";
import { UilLanguage, UilTimes } from "@tooni/iconscout-unicons-react";
import { Entry } from "@/entities";
import { translateLongText } from "@/api/translation";
import { Spinner } from "@ui/spinner";
import * as ls from "@/utils/local-storage";
import { useContentLanguageGate } from "./use-content-language-gate";
import { isRtlLang, languageDisplayName, normLang } from "./iso639";

// The full language-picker modal is only needed if the reader wants a language
// other than their own — lazy-load it so it stays off the post read path.
const EntryTranslate = dynamic(
  () => import("./index").then((m) => ({ default: m.EntryTranslate })),
  { ssr: false }
);

const DISMISS_PREFIX = "translate-dismissed";

interface Props {
  entry: Entry;
}

/**
 * Prominent, inline "Translate to <your language>" banner shown directly above
 * the post body when the detected content language differs from the reader's.
 * One tap translates the FULL body in place (plain text) with a Show-original
 * toggle; the hidden 3-dot Translate item remains as a fallback.
 *
 * Renders nothing on the server and on the first client render (the gate hook
 * resolves only in an effect), so it can live inside the server-rendered post
 * card without a hydration mismatch.
 */
export function EntryTranslateInline({ entry }: Props) {
  const dismissKey = `${DISMISS_PREFIX}:${entry.author}/${entry.permlink}`;

  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [translated, setTranslated] = useState("");
  const [fromLang, setFromLang] = useState("");
  const [changeLang, setChangeLang] = useState(false);

  // Guards the in-flight translation so Show-original / dismiss / unmount abort it.
  const requestRef = useRef<{ canceled: boolean } | null>(null);
  // Whether we currently have #post-body hidden (so we only restore what we hid).
  const hidBodyRef = useRef(false);

  const decision = useContentLanguageGate(entry, { serverConfirm: true });

  // Read the persisted per-post dismissal on the client only (avoids SSR/render
  // divergence). Keyed on author+permlink because permlinks repeat across authors.
  useEffect(() => {
    setDismissed(!!ls.get(dismissKey));
  }, [dismissKey]);

  const setBodyHidden = (hidden: boolean) => {
    const el = typeof document !== "undefined" ? document.getElementById("post-body") : null;
    if (!el) {
      return;
    }
    if (hidden) {
      el.setAttribute("hidden", "");
      hidBodyRef.current = true;
    } else {
      el.removeAttribute("hidden");
      hidBodyRef.current = false;
    }
  };

  // On unmount (e.g. navigating away, entering edit mode) abort any request and
  // restore the original body so it never stays hidden behind a stale panel.
  useEffect(
    () => () => {
      if (requestRef.current) {
        requestRef.current.canceled = true;
      }
      if (hidBodyRef.current) {
        setBodyHidden(false);
      }
    },
    []
  );

  if (dismissed || !decision?.show) {
    return null;
  }

  const { source, target } = decision;
  const targetName = languageDisplayName(target, i18next.language);
  const sourceName = languageDisplayName(source, i18next.language);

  const handleTranslate = async () => {
    setStatus("loading");
    const token = { canceled: false };
    requestRef.current = token;
    try {
      const text = postBodySummary(entry.body, 0);
      const res = await translateLongText(text, "auto", target);
      if (token.canceled) {
        return;
      }
      const detected = res.detectedLanguage?.language
        ? normLang(res.detectedLanguage.language)
        : source;
      // The instant guess was wrong and the body is actually the reader's
      // language — abort, keep the original, and dismiss so we don't re-nag.
      if (detected && detected === target) {
        ls.set(dismissKey, 1);
        setDismissed(true);
        return;
      }
      setTranslated(res.translatedText);
      setFromLang(detected || source);
      setBodyHidden(true);
      setStatus("done");
    } catch {
      if (!token.canceled) {
        setStatus("idle"); // keep the original body; allow retry
      }
    }
  };

  const handleShowOriginal = () => {
    if (requestRef.current) {
      requestRef.current.canceled = true;
    }
    setBodyHidden(false);
    setTranslated("");
    setStatus("idle");
  };

  const handleDismiss = () => {
    if (requestRef.current) {
      requestRef.current.canceled = true;
    }
    setBodyHidden(false);
    ls.set(dismissKey, 1);
    setDismissed(true);
  };

  // The translated body is always in the TARGET language, so its direction must
  // follow the target — not the detected source (e.g. Arabic -> English must be LTR).
  const rtl = isRtlLang(target);

  return (
    <div className="entry-translate-inline mb-3">
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 rounded-lg border border-[--border-color] bg-blue-duck-egg dark:bg-dark-200 px-3 py-2 text-sm">
        <UilLanguage className="w-4 h-4 text-blue-dark-sky shrink-0" />
        {status === "done" ? (
          <span className="text-gray-600 dark:text-gray-400">
            {i18next.t("entry-translate.translated-from", {
              lang: languageDisplayName(fromLang || source, i18next.language)
            })}
          </span>
        ) : (
          <span className="text-gray-charcoal dark:text-white-075">
            {i18next.t("entry-translate.banner-detected", {
              lang: sourceName,
              target: targetName
            })}
          </span>
        )}

        <span className="flex-grow" />

        {status === "idle" && (
          <button
            type="button"
            className="font-semibold text-blue-dark-sky hover:underline"
            onClick={handleTranslate}
          >
            {i18next.t("entry-translate.translate-to", { lang: targetName })}
          </button>
        )}
        {status === "loading" && (
          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Spinner className="w-3.5 h-3.5" /> {i18next.t("entry-translate.translating")}
          </span>
        )}
        {status === "done" && (
          <button
            type="button"
            className="font-semibold text-blue-dark-sky hover:underline"
            onClick={handleShowOriginal}
          >
            {i18next.t("entry-translate.show-original")}
          </button>
        )}

        <button
          type="button"
          className="font-semibold text-blue-dark-sky hover:underline"
          onClick={() => setChangeLang(true)}
        >
          {i18next.t("entry-translate.change-language")}
        </button>

        {status !== "loading" && (
          <button
            type="button"
            className="text-gray-600 hover:text-gray-charcoal dark:text-gray-400 shrink-0"
            aria-label={i18next.t("entry-translate.dismiss")}
            title={i18next.t("entry-translate.dismiss")}
            onClick={handleDismiss}
          >
            <UilTimes className="w-4 h-4" />
          </button>
        )}
      </div>

      {status === "done" && (
        <div className="mt-3">
          <div
            className="entry-body markdown-view user-selectable whitespace-pre-line"
            dir={rtl ? "rtl" : "ltr"}
          >
            {translated}
          </div>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {i18next.t("entry-translate.plain-text-note")}
          </div>
        </div>
      )}

      {changeLang && (
        <EntryTranslate
          entry={entry}
          initialTarget={target}
          onHide={() => setChangeLang(false)}
        />
      )}
    </div>
  );
}
