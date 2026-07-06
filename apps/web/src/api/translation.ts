import axios from "axios";

const translationApi = axios.create({
  baseURL: "https://translate.ecency.com",
  headers: {
    "Content-Type": "application/json"
  }
});

interface TranslationResponse {
  translatedText: string;
  // Present when source === "auto": LibreTranslate reports what it detected.
  // Used to relabel the CTA ("Translated from X") and to self-correct a wrong
  // client-side guess without a separate /detect call.
  detectedLanguage?: { confidence: number; language: string };
}

export interface DetectedLanguage {
  confidence: number;
  language: string;
}

interface LanguagesMap {
  [id: string]: {
    code: string;
    name: string;
    targets: string[];
  };
}

export interface Language {
  code: string;
  name: string;
  targets: string[];
}

// Matches emoji, pictographic symbols and their joiners/modifiers. Built from
// \uXXXX escapes and UTF-16 surrogate ranges (not the `u` flag or
// \p{Extended_Pictographic}) so it type-checks under an es5 target and behaves
// identically across engines. The variation selector, keycap combiner and
// zero-width joiner are only matched together with a base character, so a
// combiner is never stripped on its own and left orphaned.
const EMOJI_REGEX = new RegExp(
  "[\\uD83C-\\uD83F][\\uDC00-\\uDFFF](?:\\uD83C[\\uDFFB-\\uDFFF])?\\uFE0F?" +
    "(?:\\u200D[\\uD83C-\\uD83F][\\uDC00-\\uDFFF](?:\\uD83C[\\uDFFB-\\uDFFF])?\\uFE0F?)*" +
    "|[0-9#*]\\uFE0F?\\u20E3" +
    "|[\\s\\S]\\uFE0F" +
    "|[\\u2600-\\u27BF\\u2300-\\u23FF\\u2B00-\\u2BFF]",
  "g"
);

/**
 * Splits emoji out of text before it is sent to the translation API. Emoji skew
 * LibreTranslate's language auto-detection (e.g. Spanish gets detected as
 * Portuguese, leaving the text untranslated) and are mangled in the output, so
 * we translate without them and re-attach them to the result. Text with no emoji
 * is returned untouched so existing whitespace and line breaks are preserved.
 */
export const stripEmojis = (text: string): { clean: string; emojis: string } => {
  const emojis: string[] = [];
  const stripped = text.replace(EMOJI_REGEX, (match) => {
    emojis.push(match);
    return " ";
  });
  if (emojis.length === 0) {
    return { clean: text, emojis: "" };
  }
  const clean = stripped
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();
  return { clean, emojis: emojis.join("") };
};

export const getTranslation = async (
  text: string,
  source: string,
  target: string
): Promise<TranslationResponse> => {
  const { clean, emojis } = stripEmojis(text);

  // Emoji-only or empty input: nothing to translate, return as-is.
  if (!clean) {
    return { translatedText: text };
  }

  const { data } = await translationApi.post<TranslationResponse>("/translate", {
    q: clean,
    source,
    target,
    format: "text",
    api_key: ""
  });

  // Emoji are re-attached at the end rather than at their original positions;
  // acceptable for the short posts and messages this is used on.
  return {
    ...data,
    translatedText: emojis ? `${data.translatedText} ${emojis}`.trim() : data.translatedText
  };
};

export const getLanguages = async (): Promise<Language[]> => {
  const { data } = await translationApi.get<LanguagesMap>("/languages");
  return Object.values(data)
    .map(({ code, name, targets }) => ({
      code,
      name,
      targets,
    }))
    .filter((lang) => typeof lang.code === 'string' && lang.code.length > 0);
};

/**
 * Ask LibreTranslate to detect the language of a text. Returns confidence-ranked
 * ISO-639-1 candidates (e.g. [{ confidence: 92.4, language: "es" }]). Used only
 * on the full-post view to confirm/refine the instant client-side guess (never
 * per feed item). Callers must handle the empty array / rejection (fail closed).
 */
export const detectLanguage = async (text: string): Promise<DetectedLanguage[]> => {
  const { clean } = stripEmojis(text);
  if (!clean) {
    return [];
  }
  const { data } = await translationApi.post<DetectedLanguage[]>("/detect", {
    // A short sample is plenty for detection and keeps the request small.
    q: clean.slice(0, 800),
    api_key: ""
  });
  return Array.isArray(data) ? data : [];
};

// LibreTranslate can reject or truncate very long requests. Split the body into
// chunks on sentence/word boundaries and translate each, so a full-length post
// translates reliably instead of silently failing.
const MAX_TRANSLATE_CHARS = 1800;

const chunkText = (text: string, max: number): string[] => {
  if (text.length <= max) {
    return [text];
  }
  // Greedy word-accumulation. No regex lookbehind — the body is already plain
  // text joined with spaces, so word boundaries are a safe, engine-portable
  // split point (older iOS Safari can't parse lookbehind).
  const chunks: string[] = [];
  let buf = "";
  for (const word of text.split(/\s+/)) {
    if (buf && (buf.length + 1 + word.length) > max) {
      chunks.push(buf);
      buf = word;
    } else {
      buf = buf ? `${buf} ${word}` : word;
    }
  }
  if (buf) {
    chunks.push(buf);
  }
  return chunks.filter(Boolean);
};

/**
 * Translate a full (possibly long) plain-text body, chunking as needed. Returns
 * the joined translation plus the language LibreTranslate auto-detected on the
 * first chunk (authoritative — used to relabel and cache).
 */
export const translateLongText = async (
  text: string,
  source: string,
  target: string
): Promise<TranslationResponse> => {
  const chunks = chunkText(text, MAX_TRANSLATE_CHARS);
  const parts: string[] = [];
  let detectedLanguage: DetectedLanguage | undefined;
  for (const chunk of chunks) {
    // Sequential on purpose: a deliberate, spinner-backed user action, and it
    // keeps us well under the translate endpoint's per-IP rate limit.
    const res = await getTranslation(chunk, source, target);
    parts.push(res.translatedText);
    if (!detectedLanguage && res.detectedLanguage) {
      detectedLanguage = res.detectedLanguage;
    }
  }
  return { translatedText: parts.join(" "), detectedLanguage };
};
