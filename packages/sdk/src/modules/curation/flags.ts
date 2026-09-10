import type { CurationFlags } from "./types";

/**
 * The desk shows the moderation flags the backend materialized from the bot's
 * config and from external abuse lists. The web reads them through this helper
 * so the list's name stays a wire detail of the payload: it is a warning the
 * desk displays, never a verdict and never an input to indexability.
 */
export function isOnAbuseList(flags: CurationFlags | null | undefined): boolean {
  return !!flags?.spaminator || !!flags?.abuser;
}

/**
 * Any flag that keeps a row out of the public queue. `low_rep` is deliberately
 * absent: it is the one excluded reason every view still lists with a chip,
 * because 25 is the reputation a brand new account has. `negative_rep` is the
 * separate line for a reputation that has gone negative, and that one does
 * remove the row.
 */
export function isExcludedByFlags(flags: CurationFlags | null | undefined): boolean {
  return (
    !!flags?.ignorelist ||
    !!flags?.abuser ||
    !!flags?.blocked_tag ||
    !!flags?.nsfw ||
    !!flags?.patch_body ||
    !!flags?.negative_rep ||
    !!flags?.deleted
  );
}
