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

// Matches emoji, pictographic symbols and their joiners/modifiers. Uses explicit
// UTF-16 surrogate ranges and \uXXXX escapes (not the `u` flag or
// \p{Extended_Pictographic}) so it type-checks under an es5 target and behaves
// identically across engines. The surrogate pair spans U+1F000-1FFFF (emoticons,
// symbols, transport, flags, skin-tone modifiers); the BMP set covers symbols,
// dingbats, variation selectors, the zero-width joiner and the keycap combiner.
const EMOJI_REGEX =
  /[\uD83C-\uD83F][\uDC00-\uDFFF]|[\u2600-\u27BF\u2300-\u23FF\u2B00-\u2BFF]|[\uFE00-\uFE0F]|\u200D|\u20E3/g;

/**
 * Splits emoji out of text before it is sent to the translation API. Emoji skew
 * LibreTranslate's language auto-detection (e.g. Spanish gets detected as
 * Portuguese, leaving the text untranslated) and are mangled in the output, so
 * we translate without them and re-attach them to the result.
 */
export const stripEmojis = (text: string): { clean: string; emojis: string } => {
  const emojis: string[] = [];
  const clean = text
    .replace(EMOJI_REGEX, (match) => {
      emojis.push(match);
      return " ";
    })
    .replace(/\s{2,}/g, " ")
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
