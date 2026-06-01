// Minimal shape of a Sentry event's exception payload — enough to decide whether
// it carries any actionable information, without depending on @sentry/types here.
interface ExceptionLikeEvent {
  exception?: {
    values?: Array<{
      value?: string;
      stacktrace?: { frames?: unknown[] };
    }>;
  };
}

/**
 * True only for the signature of a value-less capture: `captureException(null)`
 * / `captureException(undefined)` / `captureException("")`. Sentry synthesizes
 * an Error with a "null"/"undefined"/empty value and NO stack frames — these
 * carry zero debugging info and all bucket together as the noisy "<unknown>"
 * issue (ECENCY-NEXT-1A1E).
 *
 * Deliberately conservative so we never drop a real bug:
 *  - a genuinely thrown Error always has a stack (frames) -> kept;
 *  - a non-Error thrown WITH a message keeps that value (e.g. `throw "boom"`,
 *    `throw { message: "x" }`) -> kept;
 *  - non-exception events (messages, transactions) -> kept.
 * Only when EVERY exception value is both empty AND frame-less do we treat it as
 * non-actionable noise.
 */
export function isEmptyCaptureEvent(event: ExceptionLikeEvent): boolean {
  const values = event.exception?.values;
  if (!values || values.length === 0) {
    return false;
  }
  return values.every((v) => {
    const normalized = (v.value ?? "").trim().toLowerCase();
    const emptyValue = normalized === "" || normalized === "null" || normalized === "undefined";
    const noFrames = !v.stacktrace?.frames || v.stacktrace.frames.length === 0;
    return emptyValue && noFrames;
  });
}
