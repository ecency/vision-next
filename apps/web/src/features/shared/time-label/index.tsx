"use client";

import { useEffect, useState } from "react";
import {
  dateToFormatted,
  dateToFormattedUtc,
  dateToFullRelative,
  dateToRelative,
} from "@/utils";

type Mode = "relative" | "fullRelative" | "absolute";

interface Props {
  created: string | undefined;
  refresh?: number;
  /**
   * Display mode after client mount:
   * - "relative" (default): short form, e.g. "5h"
   * - "fullRelative": long form, e.g. "5 hours ago"
   * - "absolute": formatted date using `format`
   *
   * The first paint (SSR + initial client render) is always a UTC numeric
   * string so the two sides agree and React doesn't fire hydration error
   * #418. After mount the visible text and tooltip swap to the user's local
   * timezone and locale.
   */
  mode?: Mode;
  /** dayjs format token used when `mode` is "absolute". Defaults to "LLLL". */
  format?: string;
  className?: string;
}

export function TimeLabel({
  created,
  refresh,
  mode = "relative",
  format = "LLLL",
  className = "date",
}: Props) {
  const [display, setDisplay] = useState<string | null>(null);
  const [localFormatted, setLocalFormatted] = useState<string | null>(null);

  // Numeric UTC — identical on server and client, no hydration mismatch.
  const ssrSafe = dateToFormattedUtc(created);

  useEffect(() => {
    setLocalFormatted(dateToFormatted(created));
    if (mode === "absolute") setDisplay(dateToFormatted(created, format));
    else if (mode === "fullRelative") setDisplay(dateToFullRelative(created));
    else setDisplay(dateToRelative(created));
  }, [created, refresh, mode, format]);

  return (
    <span className={className} title={localFormatted ?? ssrSafe} suppressHydrationWarning>
      {display ?? ssrSafe}
    </span>
  );
}

/**
 * String form of {@link TimeLabel} for cases where a React node won't fit —
 * attribute values, i18next interpolation. Returns "" before mount and the
 * formatted value after, so SSR HTML has an empty slot that fills in on the
 * client. Use this when SSR/client text divergence would cause a hydration
 * mismatch (timezone-dependent dates, locale-dependent formats).
 */
export function useFormattedDate(
  value: string | undefined,
  mode: Mode = "relative",
  format: string = "LLLL",
  refresh?: number
): string {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!value) {
      setText("");
      return;
    }
    if (mode === "absolute") setText(dateToFormatted(value, format));
    else if (mode === "fullRelative") setText(dateToFullRelative(value));
    else setText(dateToRelative(value));
  }, [value, mode, format, refresh]);

  return text;
}
