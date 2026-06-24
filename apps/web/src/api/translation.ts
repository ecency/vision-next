import axios from "axios";

const translationApi = axios.create({
  baseURL: "https://translate.ecency.com",
  headers: {
    "Content-Type": "application/json"
  }
});

interface TranslationResponse {
  translatedText: string;
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
