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

export const chunkText = (text: string, max: number): string[] => {
  if (text.length <= max) {
    return [text];
  }
  // Greedy word-accumulation. No regex lookbehind — the body is already plain
  // text joined with spaces, so word boundaries are a safe, engine-portable
  // split point (older iOS Safari can't parse lookbehind).
  const chunks: string[] = [];
  let buf = "";
  const flush = () => {
    if (buf) {
      chunks.push(buf);
      buf = "";
    }
  };
  for (const word of text.split(/\s+/)) {
    // A single "word" longer than the limit — e.g. space-less CJK text, where
    // the whole body is one token — must be hard-split by character, or it would
    // be sent as one over-limit request and truncated/rejected.
    if (word.length > max) {
      flush();
      for (let i = 0; i < word.length; i += max) {
        chunks.push(word.slice(i, i + max));
      }
    } else if (buf && buf.length + 1 + word.length > max) {
      flush();
      buf = word;
    } else {
      buf = buf ? `${buf} ${word}` : word;
    }
  }
  flush();
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

// Markdown-aware translation for the compose-side feature: only prose is sent
// to LibreTranslate; code fences, images, tables, raw HTML, bare URLs and
// horizontal rules pass through untouched, and heading/quote/list markers are
// stripped before and re-attached after translation. Batches stay below the
// long-text chunk limit since blocks are joined with blank lines.
const MAX_BLOCK_BATCH_CHARS = 1500;

const FENCE_LINE = /^\s*(`{3,}|~{3,})/;
const IMAGE_ONLY_LINE = /^\s*!\[[^\]]*\]\([^)]*\)\s*$/;
const HORIZONTAL_RULE_LINE = /^\s*([-*_][^\S\n]*){3,}$/;
const URL_ONLY_LINE = /^\s*https?:\/\/\S+\s*$/;
const TABLE_SEPARATOR_LINE = /^\s*[|:\s-]+\s*$/;
// Leading line markers that must survive translation: headings, quotes and
// list items, possibly nested ("  - ", "> > ").
const LINE_MARKER_PREFIX = /^(\s*(?:(?:#{1,6}|>|[-*+]|\d+\.)\s+)+)/;

/**
 * Split markdown into blocks on blank lines, keeping fenced code regions
 * together even when they contain blank lines. A fence directly under text
 * (no separating blank line) still starts its own block so the surrounding
 * prose can be translated without dragging the code along.
 */
const splitMarkdownBlocks = (markdown: string): string[] => {
  const blocks: string[] = [];
  let current: string[] = [];
  let fence: string | null = null;

  const flush = () => {
    if (current.length > 0) {
      blocks.push(current.join("\n"));
      current = [];
    }
  };

  for (const line of markdown.split("\n")) {
    const fenceMatch = line.match(FENCE_LINE);
    if (fence) {
      current.push(line);
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) {
        fence = null;
        flush();
      }
    } else if (fenceMatch) {
      flush();
      fence = fenceMatch[1];
      current.push(line);
    } else if (!line.trim()) {
      flush();
    } else {
      current.push(line);
    }
  }
  flush();
  return blocks;
};

const isSkippableBlock = (block: string): boolean => {
  if (FENCE_LINE.test(block) || /^\s*</.test(block)) {
    return true;
  }
  const lines = block.split("\n");
  if (
    lines.every((line) => HORIZONTAL_RULE_LINE.test(line)) ||
    lines.every((line) => IMAGE_ONLY_LINE.test(line)) ||
    lines.every((line) => URL_ONLY_LINE.test(line))
  ) {
    return true;
  }
  // Tables: a |---| separator row directly below a pipe row (the GFM shape).
  // Cell-safe translation is out of scope, so the whole block is passed
  // through; requiring adjacency keeps prose that merely contains pipe
  // characters translatable.
  return lines.some(
    (line, i) =>
      i > 0 &&
      line.includes("|") &&
      line.includes("-") &&
      TABLE_SEPARATOR_LINE.test(line) &&
      lines[i - 1].includes("|")
  );
};

interface TranslateRequest {
  text: string;
  apply: (translated: string) => void;
}

/**
 * Translate a markdown document while preserving its structure. Consecutive
 * plain paragraphs are batched into one request (whole blocks only, never
 * across skipped blocks); marker lines are translated line-wise with their
 * prefix re-attached. Requests run sequentially and any failure rejects the
 * whole call, so callers never apply a partially translated document.
 */
export const translateMarkdown = async (
  markdown: string,
  source: string,
  target: string,
  onProgress?: (done: number, total: number) => void,
  isCancelled?: () => boolean
): Promise<string> => {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  if (!normalized.trim()) {
    return normalized;
  }

  const blocks = splitMarkdownBlocks(normalized);
  const output: (string | null)[] = [...blocks];
  const requests: TranslateRequest[] = [];

  let batchIndices: number[] = [];
  let batchSize = 0;
  const flushBatch = () => {
    if (batchIndices.length === 0) {
      return;
    }
    const indices = batchIndices;
    requests.push({
      text: indices.map((i) => blocks[i]).join("\n\n"),
      apply: (translated) => {
        output[indices[0]] = translated;
        indices.slice(1).forEach((i) => {
          output[i] = null;
        });
      }
    });
    batchIndices = [];
    batchSize = 0;
  };

  blocks.forEach((block, index) => {
    if (isSkippableBlock(block)) {
      flushBatch();
      return;
    }

    const lines = block.split("\n");
    if (lines.some((line) => LINE_MARKER_PREFIX.test(line))) {
      flushBatch();
      const translatedLines = [...lines];
      lines.forEach((line, lineIndex) => {
        const marker = line.match(LINE_MARKER_PREFIX);
        // Marker-less continuation lines keep their leading indentation,
        // which translation would otherwise strip.
        const prefix = marker ? marker[1] : line.match(/^\s*/)?.[0] ?? "";
        const rest = line.slice(prefix.length);
        if (!rest.trim() || IMAGE_ONLY_LINE.test(rest) || URL_ONLY_LINE.test(rest)) {
          return;
        }
        const chunks =
          rest.length > MAX_BLOCK_BATCH_CHARS ? chunkText(rest, MAX_BLOCK_BATCH_CHARS) : [rest];
        const parts: string[] = new Array(chunks.length).fill("");
        chunks.forEach((chunk, chunkIndex) => {
          requests.push({
            text: chunk,
            apply: (translated) => {
              parts[chunkIndex] = translated;
              translatedLines[lineIndex] = `${prefix}${parts.join(" ")}`;
              output[index] = translatedLines.join("\n");
            }
          });
        });
      });
      return;
    }

    if (block.length > MAX_BLOCK_BATCH_CHARS) {
      flushBatch();
      const chunks = chunkText(block, MAX_BLOCK_BATCH_CHARS);
      const parts: string[] = new Array(chunks.length).fill("");
      chunks.forEach((chunk, chunkIndex) => {
        requests.push({
          text: chunk,
          apply: (translated) => {
            parts[chunkIndex] = translated;
            output[index] = parts.join(" ");
          }
        });
      });
      return;
    }

    if (batchIndices.length > 0 && batchSize + 2 + block.length > MAX_BLOCK_BATCH_CHARS) {
      flushBatch();
    }
    batchSize += (batchIndices.length > 0 ? 2 : 0) + block.length;
    batchIndices.push(index);
  });
  flushBatch();

  if (requests.length === 0) {
    return blocks.join("\n\n");
  }

  onProgress?.(0, requests.length);
  let done = 0;
  for (const request of requests) {
    if (isCancelled?.()) {
      throw new Error("translate-cancelled");
    }
    // Sequential on purpose: gentle on the shared LibreTranslate instance and
    // keeps the progress counter meaningful.
    const { translatedText } = await getTranslation(request.text, source, target);
    request.apply(translatedText);
    done += 1;
    onProgress?.(done, requests.length);
  }

  return output.filter((block): block is string => block !== null).join("\n\n");
};
