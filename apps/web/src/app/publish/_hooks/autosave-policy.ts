// Shared throttling policy for the publish-page autosave hooks.
// Tuned for two competing concerns: don't lose typed work (debounce + min
// interval set the worst-case data-loss window) and don't hammer the
// private-api drafts endpoint when the server is rejecting (circuit
// breaker), since a single user pausing every few seconds while writing
// otherwise produces dozens of save attempts per minute.

// Wait this long after the last edit before considering a save.
export const AUTOSAVE_DEBOUNCE_MS = 10_000;

// Minimum time between save attempts, even if the user keeps editing.
// Caps autosave traffic to at most ~1/minute per editor session.
export const AUTOSAVE_MIN_INTERVAL_MS = 60_000;

// After this many consecutive failures, open the circuit and stop trying
// for AUTOSAVE_COOLDOWN_MS — gives the server (or the user) time to
// recover and avoids a 406-loop draining anyone's inbox of error toasts.
export const AUTOSAVE_FAIL_THRESHOLD = 3;
export const AUTOSAVE_COOLDOWN_MS = 5 * 60_000;
