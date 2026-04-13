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
  await requireEthereum().request({
    method: "wallet_requestSnaps",
    params: { [HIVE_SNAP_ID]: {} }
  });
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
        ([pub]: [string, number]) => pub === postingPubKey
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
    onError: (e) => error(...formatError(e))
  });
}
