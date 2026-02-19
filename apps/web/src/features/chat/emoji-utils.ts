import emojiDataRaw from "@emoji-mart/data";
import { SearchIndex, init as initEmojiMart } from "emoji-mart";

const emojiData = emojiDataRaw as any;

export const MATTERMOST_SHORTCODE_REGEX = /:([a-zA-Z0-9_+-]+):/g;
export const EMOJI_TRIGGER_REGEX = /:([a-zA-Z0-9_+-]{1,30})$/i;

export type EmojiSuggestion = {
  id: string;
  name: string;
  native: string;
};

// Build emoji mapping from emoji-mart data
const SHORTCODE_TO_NATIVE = new Map<string, string>();
const NATIVE_TO_SHORTCODE = new Map<string, string>();

Object.entries(emojiData.emojis).forEach(([id, emoji]: [string, any]) => {
  const primaryId = id.toLowerCase();
  const native = emoji.skins?.[0]?.native;

  emoji.skins?.forEach((skin: any) => {
    if (!skin?.native) return;

    const shortcodes = Array.isArray(skin.shortcodes)
      ? skin.shortcodes
      : skin.shortcodes
        ? [skin.shortcodes]
        : [];
    const shortcode = (shortcodes[0]?.replace(/^:|:$/g, "") || primaryId).toLowerCase();

    NATIVE_TO_SHORTCODE.set(skin.native, shortcode);
    if (!SHORTCODE_TO_NATIVE.has(shortcode)) {
      SHORTCODE_TO_NATIVE.set(shortcode, skin.native);
    }
  });

  if (native && !SHORTCODE_TO_NATIVE.has(primaryId)) {
    SHORTCODE_TO_NATIVE.set(primaryId, native);
  }

  emoji.aliases?.forEach((alias: string) => {
    if (native && !SHORTCODE_TO_NATIVE.has(alias.toLowerCase())) {
      SHORTCODE_TO_NATIVE.set(alias.toLowerCase(), native);
    }
  });
});

Object.entries(emojiData.aliases || {}).forEach(([alias, id]: [string, any]) => {
  const native = SHORTCODE_TO_NATIVE.get((id as string).toLowerCase());
  if (native) {
    SHORTCODE_TO_NATIVE.set(alias.toLowerCase(), native);
  }
});

let emojiDataInitPromise: Promise<void> | null = null;

export const ensureEmojiDataReady = () => {
  if (!emojiDataInitPromise) {
    emojiDataInitPromise = initEmojiMart({ data: emojiData as unknown });
  }
  return emojiDataInitPromise;
};

export function getEmojiShortcodeFromNative(emoji: string): string | undefined {
  return NATIVE_TO_SHORTCODE.get(emoji);
}

export function getNativeEmojiFromShortcode(shortcode: string): string | undefined {
  return SHORTCODE_TO_NATIVE.get(shortcode.toLowerCase());
}

export function toMattermostEmojiName(emoji: string): string {
  return getEmojiShortcodeFromNative(emoji) || emoji.replace(/^:|:$/g, "").trim();
}

/**
 * Convert native emojis in a message to Mattermost shortcode format
 */
const EMOJI_UNICODE_REGEX = new RegExp("\\p{Extended_Pictographic}+", "gu");

export function normalizeMessageEmojis(message: string): string {
  return message.replace(EMOJI_UNICODE_REGEX, (emoji: string) => {
    const emojiName = toMattermostEmojiName(emoji);
    if (!emojiName) return emoji;
    return `:${emojiName}:`;
  });
}

/**
 * Convert Mattermost shortcodes to native emojis for display
 */
export function decodeMessageEmojis(message: string): string {
  return message.replace(MATTERMOST_SHORTCODE_REGEX, (_, emojiName) => {
    const native = getNativeEmojiFromShortcode(emojiName);
    return native || `:${emojiName}:`;
  });
}

/**
 * Search for emojis matching a query
 */
export async function searchEmojis(query: string, maxResults = 15): Promise<EmojiSuggestion[]> {
  await ensureEmojiDataReady();

  const results = await SearchIndex.search(query, { maxResults, caller: "chat" });

  return (results || [])
    .map((emoji: any) => {
      if (!emoji?.id || !emoji?.skins?.[0]?.native) return null;

      return {
        id: emoji.id as string,
        name: (emoji.name as string) || (emoji.id as string),
        native: emoji.skins[0].native as string
      } satisfies EmojiSuggestion;
    })
    .filter(Boolean) as EmojiSuggestion[];
}
