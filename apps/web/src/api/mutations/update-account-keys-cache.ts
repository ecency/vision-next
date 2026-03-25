import { getAccountFullQueryOptions, type FullAccount } from "@ecency/sdk";
import type { QueryClient } from "@tanstack/react-query";

type AuthorityName = "owner" | "active" | "posting";

interface RevokeKeysUpdate {
  /** Keys to remove per authority */
  revokeMap: Partial<Record<AuthorityName, string[]>>;
}

interface AddKeysUpdate {
  /** New public key to add per authority */
  addMap: Record<AuthorityName, string>;
  /** New memo public key */
  memoKey: string;
  /** Keys to remove per authority (optional, for add+revoke combo) */
  revokeMap?: Partial<Record<AuthorityName, string[]>>;
}

/**
 * Optimistically update the cached FullAccount after adding/revoking keys.
 * Immediately updates the React Query cache so the UI reflects the change,
 * then triggers a background refetch to reconcile with the blockchain.
 */
export function updateAccountKeysCache(
  queryClient: QueryClient,
  username: string,
  update: RevokeKeysUpdate | AddKeysUpdate
) {
  const qk = getAccountFullQueryOptions(username).queryKey;

  queryClient.setQueryData<FullAccount | undefined>(qk, (old) => {
    if (!old) return old;
    const updated: FullAccount = JSON.parse(JSON.stringify(old));

    const revokeMap = update.revokeMap ?? {};

    for (const auth of ["owner", "active", "posting"] as const) {
      if (!updated[auth]?.key_auths) continue;

      // Remove revoked keys
      const toRevoke = revokeMap[auth];
      if (toRevoke && toRevoke.length > 0) {
        updated[auth].key_auths = updated[auth].key_auths.filter(
          ([key]) => !toRevoke.includes(String(key))
        );
      }

      // Add new keys (only if addMap is present)
      if ("addMap" in update) {
        const newKey = update.addMap[auth];
        const alreadyExists = updated[auth].key_auths.some(
          ([key]) => String(key) === newKey
        );
        if (!alreadyExists) {
          updated[auth].key_auths.push([newKey, 1]);
        }
      }
    }

    // Update memo key if provided
    if ("memoKey" in update) {
      updated.memo_key = update.memoKey;
    }

    return updated;
  });

  // Background refetch to reconcile with blockchain
  queryClient.invalidateQueries({ queryKey: qk });
}
