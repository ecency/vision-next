import { CONFIG, FullAccount, getAccountFullQueryOptions } from "@ecency/sdk";
import { PrivateKey } from "@hiveio/dhive";
import { deriveHiveKeys } from "./derive-hive-bip44-keys";

export type HiveKeyDerivation = "bip44" | "master-password" | "unknown";

export async function detectHiveKeyDerivation(
  username: string,
  seed: string,
  type: "active" | "owner" = "active"
): Promise<HiveKeyDerivation> {
  await CONFIG.queryClient.prefetchQuery(getAccountFullQueryOptions(username));
  const account = CONFIG.queryClient.getQueryData(
    getAccountFullQueryOptions(username).queryKey
  ) as FullAccount;
  if (!account) {
    throw new Error(`[Ecency][Wallets] - account ${username} not found`);
  }

  const bip44 = deriveHiveKeys(seed);
  const bip44Active = bip44.activePubkey;
  const matchBip44 = account.active.key_auths.some(
    ([pub]) => pub.toString() === bip44Active
  );
  if (matchBip44) {
    return "bip44";
  }

  const legacyActive = PrivateKey.fromLogin(username, seed, type)
    .createPublic()
    .toString();
  const matchLegacy = account[type].key_auths.some(
    ([pub]) => pub.toString() === legacyActive
  );
  if (matchLegacy) {
    return "master-password";
  }

  return "unknown";
}
