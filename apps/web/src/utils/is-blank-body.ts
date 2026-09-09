/**
 * One definition of "this content is blank", shared by every composer and
 * comment mutation so the UI gate and the guards behind it agree.
 *
 * `String.trim()` alone is not enough. It strips Unicode whitespace, so NBSP
 * and U+FEFF go, but zero-width characters (U+200B, ZWNJ, ZWJ, word joiner)
 * are format characters, not whitespace, so a body made only of those survives
 * `.trim()` and gets broadcast as a blank comment. Stripping the Cf category
 * first closes that. Emoji keep their base code points, so a ZWJ sequence like
 * 👨‍👩‍👧 is still content.
 *
 * The stripped string is only ever used for this test. What gets broadcast is
 * always the text the user typed, untouched.
 */
const FORMAT_CHARS = /\p{Cf}/gu;

export function isBlankBody(text?: string | null): boolean {
  return !text || !text.replace(FORMAT_CHARS, "").trim();
}
