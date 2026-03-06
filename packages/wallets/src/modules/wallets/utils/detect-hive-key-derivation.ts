import { CONFIG, FullAccount, getAccountFullQueryOptions } from "@ecency/sdk";
import { PrivateKey } from "@hiveio/dhive";
import { deriveHiveKeys } from "./derive-hive-bip44-keys";

export type HiveKeyDerivation = "bip44" | "master-password" | "unknown";

export async function detectHiveKeyDerivation(
    username: string,
    seed: string,
    type: "active" | "owner" | "memo" = "active"
): Promise<HiveKeyDerivation> {
  const uname = username.trim().toLowerCase();

  // ensure we actually have data
  const account = (await CONFIG.queryClient.fetchQuery(
      getAccountFullQueryOptions(uname)
  )) as FullAccount;

  if (type === "memo") {
    // Memo key is a single public key on the account, not an authority array
    const accountMemoKey = String(account.memo_key);

    const bip44 = deriveHiveKeys(seed);
    if (bip44.memoPubkey === accountMemoKey) return "bip44";

    const legacyPub = PrivateKey.fromLogin(uname, seed, "memo")
        .createPublic()
        .toString();
    if (legacyPub === accountMemoKey) return "master-password";

    return "unknown";
  }

  // pick the right authority based on `type`
  const auth = account[type];

  // --- BIP44 check (match selected authority) ---
  const bip44 = deriveHiveKeys(seed);
  const bip44Pub =
      type === "owner" ? bip44.ownerPubkey : bip44.activePubkey;

  const matchBip44 = auth.key_auths.some(([pub]) => String(pub) === bip44Pub);
  if (matchBip44) return "bip44";

  // --- Master password (legacy) check (match selected authority) ---
  const legacyPub = PrivateKey.fromLogin(uname, seed, type)
      .createPublic()
      .toString();

  const matchLegacy = auth.key_auths.some(([pub]) => String(pub) === legacyPub);
  if (matchLegacy) return "master-password";

  return "unknown";
}
