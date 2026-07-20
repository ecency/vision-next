import { useMutation, useQuery } from "@tanstack/react-query";
import { useLoginInApp } from "./use-login-in-app";
import { EcencyConfigManager } from "@/config";
import { getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { makeHsCode } from "@/utils";
import i18next from "i18next";
import { error } from "../../feedback";
import { formatError } from "@/api/format-error";

const HIVE_SNAP_ID = "npm:@hiveio/metamask-snap";

// Login signs via the snap's hive_encrypt(number[]) branch, which only exists in
// @hiveio/metamask-snap >= 1.7.0. Request that range so MetaMask prompts an
// upgrade, and verify the resolved version so an older pinned/cached snap fails
// with a clear message instead of a generic toast.
const MIN_SNAP_VERSION = "1.7.0";

/** True when semver `version` is >= `min` (major.minor.patch; ignores pre-release). */
export function isSnapVersionAtLeast(version: string, min: string): boolean {
  const parse = (v: string) => v.split(".").map((n) => parseInt(n, 10) || 0);
  const [a = 0, b = 0, c = 0] = parse(version);
  const [x = 0, y = 0, z = 0] = parse(min);
  if (a !== x) return a > x;
  if (b !== y) return b > y;
  return c >= z;
}

interface HivePublicKey {
  publicKey: string;
  role?: string;
  accountIndex: number;
  addressIndex: number;
}

function requireEthereum() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask/ethereum provider not available");
  }
  return window.ethereum;
}

async function ensureHiveSnap(): Promise<void> {
  const result = (await requireEthereum().request({
    method: "wallet_requestSnaps",
    params: { [HIVE_SNAP_ID]: { version: `^${MIN_SNAP_VERSION}` } }
  })) as Record<string, { version?: string }> | undefined;

  const snap = result?.[HIVE_SNAP_ID];
  if (!snap) {
    throw new Error(i18next.t("login.metamask-snap-unavailable"));
  }
  // A snap with no reported version is treated as outdated: signing relies on the
  // >= 1.7.0 behavior, so fail safe rather than proceed and break cryptically.
  if (!snap.version || !isSnapVersionAtLeast(snap.version, MIN_SNAP_VERSION)) {
    throw new Error(i18next.t("login.metamask-snap-outdated"));
  }
}

async function getHivePublicKeys(): Promise<HivePublicKey[]> {
  const result = await requireEthereum().request({
    method: "wallet_invokeSnap",
    params: {
      snapId: HIVE_SNAP_ID,
      request: {
        method: "hive_getPublicKeys",
        params: {
          keys: [
            { role: "posting", accountIndex: 0 }
          ]
        }
      }
    }
  });
  return (result as { publicKeys: HivePublicKey[] }).publicKeys;
}

async function signBufferWithSnap(message: string): Promise<string> {
  // Sign an arbitrary message using the Hive snap's posting key.
  // We use hive_encrypt with a byte array buffer — when given number[] instead of
  // a string, the snap SHA-256 hashes the bytes and calls wallet.signDigest(),
  // producing a standard Hive signature (same as signBuffer).
  const bytes = Array.from(new TextEncoder().encode(message));

  const result = await requireEthereum().request({
    method: "wallet_invokeSnap",
    params: {
      snapId: HIVE_SNAP_ID,
      request: {
        method: "hive_encrypt",
        params: {
          buffer: bytes,
          firstKey: { role: "posting", accountIndex: 0 }
        }
      }
    }
  });
  // hive_encrypt returns { buffer: signatureHex } when given a byte array
  return (result as { buffer: string }).buffer;
}

export function useLoginByMetaMask(username: string) {
  const loginInApp = useLoginInApp(username);
  const queryClient = getQueryClient();
  const accountQueryOptions = getAccountFullQueryOptions(username);
  const { data: account } = useQuery(accountQueryOptions);

  return useMutation({
    mutationKey: ["login-by-metamask", username],
    mutationFn: async () => {
      if (!username) {
        throw new Error(i18next.t("login.error-fields-required"));
      }

      if (!window.ethereum?.isMetaMask) {
        throw new Error(i18next.t("login.metamask-not-found"));
      }

      // 1. Fetch account
      const accountData = account ?? (await queryClient.fetchQuery(accountQueryOptions));
      if (!accountData) {
        throw new Error(i18next.t("login.error-user-not-found"));
      }

      // 2. Install/connect Hive snap
      await ensureHiveSnap();

      // 3. Get posting public key from snap
      const publicKeys = await getHivePublicKeys();
      const postingPubKey = publicKeys.find((k) => k.role === "posting")?.publicKey;

      if (!postingPubKey) {
        throw new Error(i18next.t("login.metamask-no-keys"));
      }

      // 4. Verify posting key matches on-chain account
      const matchesPosting = accountData.posting.key_auths.some(
        ([pub]) => pub.toString() === postingPubKey
      );

      if (!matchesPosting) {
        throw new Error(i18next.t("login.metamask-key-mismatch"));
      }

      // 5. Sign HS code with snap's posting key
      const code = await makeHsCode(
        EcencyConfigManager.CONFIG.service.hsClientId,
        username,
        signBufferWithSnap
      );

      // 6. Complete login
      await loginInApp(code, null, accountData, "metamask");
    },
    onError: (e: any) => {
      // User dismissed the MetaMask / snap prompt (EIP-1193 4001): benign, so
      // don't show a scary error toast for a deliberate cancel.
      if (e?.code === 4001 || /user rejected|user denied/i.test(e?.message ?? "")) {
        return;
      }
      error(...formatError(e));
    }
  });
}
