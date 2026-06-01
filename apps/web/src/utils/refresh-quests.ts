import type { QueryClient } from "@tanstack/react-query";
import { QueryKeys } from "@ecency/sdk";

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced refresh of the quests/streak query so the ambient navbar streak pill
 * and the /perks tiles update shortly after a points-earning action.
 *
 * The debounce coalesces a burst of actions into a single `/private-api/quests`
 * request (instead of one per action), and the invalidation only triggers a
 * network refetch when something is actually observing the query (e.g. the
 * navbar pill or the /perks page is mounted).
 *
 * Intentionally NOT wired into the high-frequency vote path — votes already get
 * rich inline feedback (count, payout, animation) and would otherwise fan out
 * requests during fast feed voting.
 */
export function scheduleQuestsRefresh(queryClient: QueryClient, username?: string | null) {
  const name = username?.replace("@", "");
  if (!name) {
    return;
  }
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    timer = null;
    queryClient.invalidateQueries({ queryKey: QueryKeys.quests.status(name) });
  }, 4000);
}
