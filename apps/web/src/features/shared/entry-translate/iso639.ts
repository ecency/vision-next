/**
 * Pure, framework-free language helpers for the "translate when the reader's
 * language differs from the content" feature. No React, no network, no DOM —
 * unit-testable in isolation.
 *
 * Two code systems meet here:
 *  - franc-min (the client-side detector) emits ISO-639-3 codes ("spa", "pes").
 *  - LibreTranslate (translate.ecency.com) speaks ISO-639-1 codes ("es", "fa").
 *
 * Our LibreTranslate instance exposes 43 languages and — verified against
 * /languages — every source can translate to every target (all-to-all), so a
 * per-pair check is unnecessary: a CTA is valid whenever both the detected
 * source and the reader target are in the supported set and they differ.
 */

// The 43 languages our LibreTranslate instance supports (source === target set).
// Keep in sync with translate.ecency.com/languages. Used only as an offline
// gate; the modal's language picker still fetches the live list.
export const LIBRETRANSLATE_CODES = [
  "ar", "az", "bg", "bn", "ca", "cs", "da", "de", "el", "en", "eo", "es",
  "et", "fa", "fi", "fr", "ga", "he", "hi", "hu", "id", "it", "ja", "ko",
  "lt", "lv", "ms", "nb", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sq",
  "sv", "th", "tl", "tr", "uk", "zh", "zt"
] as const;

export const LIBRETRANSLATE_SOURCES = new Set<string>(LIBRETRANSLATE_CODES);
export const LIBRETRANSLATE_TARGETS = new Set<string>(LIBRETRANSLATE_CODES);

/**
 * ISO-639-3 (franc-min output) -> ISO-639-1 (LibreTranslate), restricted to the
 * languages BOTH franc-min can emit AND our LibreTranslate supports.
 *
 * Codes verified empirically against the installed franc-min@6 data/expressions
 * (not assumed): franc emits "pes" for Persian (NOT "fas"), "arb" for Arabic,
 * "cmn" for Chinese, "zlm" for Malay, "azj" for Azerbaijani, "nb"->"nob" absent
 * (franc-min lacks Norwegian), etc.
 *
 * franc-min does NOT cover 14 of LibreTranslate's languages
 * (ca, da, eo, et, fi, ga, he, lt, lv, nb, sk, sl, sq, zt). Content in those
 * languages is caught by the server /detect escalation on the full-post view;
 * in feed/wave chips (franc-only) it simply yields no chip. This is intentional.
 */
export const ISO_639_3_TO_1: Record<string, string> = {
  arb: "ar", // Arabic
  azj: "az", // North Azerbaijani
  bul: "bg", // Bulgarian
  ben: "bn", // Bengali
  cmn: "zh", // Mandarin Chinese
  ces: "cs", // Czech
  deu: "de", // German
  ell: "el", // Greek
  eng: "en", // English
  spa: "es", // Spanish
  pes: "fa", // Western Persian (franc emits "pes", not "fas")
  fra: "fr", // French
  hin: "hi", // Hindi
  hun: "hu", // Hungarian
  ind: "id", // Indonesian
  ita: "it", // Italian
  jpn: "ja", // Japanese
  kor: "ko", // Korean
  nld: "nl", // Dutch
  pol: "pl", // Polish
  por: "pt", // Portuguese
  ron: "ro", // Romanian
  rus: "ru", // Russian
  swe: "sv", // Swedish
  tgl: "tl", // Tagalog
  tha: "th", // Thai
  tur: "tr", // Turkish
  ukr: "uk", // Ukrainian
  zlm: "ms" // Malay
};

/** Map a franc-min ISO-639-3 code to a LibreTranslate ISO-639-1 code, or null. */
export function francToIso1(code3: string | null | undefined): string | null {
  if (!code3 || code3 === "und") {
    return null;
  }
  return ISO_639_3_TO_1[code3] ?? null;
}

/**
 * Normalize a locale/language tag ("en-US", "pt_BR", "zh-Hant") to a single
 * LibreTranslate code. Traditional-Chinese variants map to LibreTranslate's
 * dedicated "zt" so Traditional readers aren't silently served Simplified.
 */
export function normLang(input: string | null | undefined): string {
  if (!input) {
    return "";
  }
  const lower = input.toLowerCase().replace(/_/g, "-");
  if (
    lower === "zh-hant" ||
    lower.startsWith("zh-hant-") ||
    lower === "zh-tw" ||
    lower === "zh-hk" ||
    lower === "zh-mo"
  ) {
    return "zt";
  }
  return lower.split("-")[0];
}

/** Right-to-left languages among LibreTranslate's set (+ a couple of extras). */
const RTL_LANGS = new Set(["ar", "he", "fa", "ur", "ps", "dv", "yi"]);

export function isRtlLang(code: string | null | undefined): boolean {
  return RTL_LANGS.has(normLang(code));
}

/** Minimum plain-text length before we bother detecting / offering a CTA. */
export const MIN_DETECT_CHARS = 40;

export interface TranslateCtaDecision {
  show: boolean;
  /** Detected content language (ISO-639-1), best available guess. */
  source: string;
  /** Reader's target language (ISO-639-1), always a supported target. */
  target: string;
}

/**
 * The single gate: should we offer a prominent "Translate to <reader>" CTA?
 *
 * @param detected content language (ISO-639-1) or null/"und" when unknown
 * @param reader   reader's resolved language (ISO-639-1)
 * @param textLength plain-text length of the sample used for detection
 */
export function resolveTranslateCta({
  detected,
  reader,
  textLength
}: {
  detected: string | null | undefined;
  reader: string;
  textLength: number;
}): TranslateCtaDecision {
  const normDetected = detected ? normLang(detected) : null;
  const target = LIBRETRANSLATE_TARGETS.has(reader) ? reader : "en";

  const show =
    textLength >= MIN_DETECT_CHARS &&
    !!normDetected &&
    normDetected !== "und" &&
    LIBRETRANSLATE_SOURCES.has(normDetected) &&
    LIBRETRANSLATE_TARGETS.has(target) &&
    normDetected !== target;

  return { show, source: normDetected ?? "", target };
}

// Codes that Intl.DisplayNames may not resolve on its own, or that we prefer to
// render with a specific label. "zt" is not a standard BCP-47 code.
const DISPLAY_NAME_FALLBACK: Record<string, string> = {
  ar: "Arabic", az: "Azerbaijani", bg: "Bulgarian", bn: "Bengali",
  ca: "Catalan", cs: "Czech", da: "Danish", de: "German", el: "Greek",
  en: "English", eo: "Esperanto", es: "Spanish", et: "Estonian",
  fa: "Persian", fi: "Finnish", fr: "French", ga: "Irish", he: "Hebrew",
  hi: "Hindi", hu: "Hungarian", id: "Indonesian", it: "Italian",
  ja: "Japanese", ko: "Korean", lt: "Lithuanian", lv: "Latvian",
  ms: "Malay", nb: "Norwegian", nl: "Dutch", pl: "Polish",
  pt: "Portuguese", ro: "Romanian", ru: "Russian", sk: "Slovak",
  sl: "Slovenian", sq: "Albanian", sv: "Swedish", th: "Thai",
  tl: "Tagalog", tr: "Turkish", uk: "Ukrainian", zh: "Chinese",
  zt: "Chinese (Traditional)"
};

/**
 * Human-readable language name for a LibreTranslate code, localized to the UI
 * language when the platform can, falling back to an English label.
 */
export function languageDisplayName(code: string, uiLang?: string): string {
  const norm = normLang(code);
  // "zt" isn't a real BCP-47 tag; render it via zh-Hant.
  const bcp47 = norm === "zt" ? "zh-Hant" : norm;
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
      const dn = new Intl.DisplayNames([uiLang || "en", "en"], { type: "language" });
      const name = dn.of(bcp47);
      if (name && name.toLowerCase() !== bcp47.toLowerCase()) {
        return norm === "zt" ? `${name} (Traditional)` : name;
      }
    }
  } catch {
    // Intl.DisplayNames unavailable / invalid tag — fall through.
  }
  return DISPLAY_NAME_FALLBACK[norm] ?? code;
}
