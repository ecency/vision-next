import type { BroadcastMode } from "./use-broadcast-mutation";
import type { PlatformAdapter } from "@/modules/core/types";

/**
 * Delay (ms) before invalidating chain-derived queries after an async
 * broadcast. ~1.3 Hive blocks (3s/block) so the just-broadcast transaction has
 * landed in a block before we refetch — otherwise the refetch returns pre-tx
 * state (e.g. a stale wallet balance).
 */
export const BROADCAST_INCLUSION_DELAY_MS = 4000;

/**
 * Invalidate queries after a broadcast, accounting for broadcast mode.
 *
 * - `'sync'`: the transaction already waited for block inclusion, so refetch
 *   immediately (returns the adapter's promise so callers may await it).
 * - `'async'` (default) / undefined: the transaction is only in the mempool, so
 *   a refetch now would read pre-tx state — defer by ~1 block.
 *
 * No-ops when the adapter can't invalidate.
 */
export function invalidateAfterBroadcast(
  adapter: PlatformAdapter | null | undefined,
  broadcastMode: BroadcastMode | undefined,
  keys: any[][]
): void | Promise<void> {
  if (!adapter?.invalidateQueries) return;
  if (broadcastMode === "sync") {
    // Method call (not an extracted reference) so `this` stays bound to adapter.
    return adapter.invalidateQueries(keys);
  }
  setTimeout(() => adapter.invalidateQueries?.(keys), BROADCAST_INCLUSION_DELAY_MS);
}
