import type { Operation, TransactionConfirmation } from "@hiveio/dhive";
import type { PlatformAdapter } from "@ecency/sdk";
import { authenticationStore } from "@/store";
import { queryClient } from "@/consts/react-query";
import {
  broadcast as keychainBroadcast,
  isKeychainAvailable,
} from "@/features/auth/utils/keychain";
import { broadcastWithHiveAuth } from "@/features/auth/utils/hive-auth";

/**
 * Map SDK lowercase key types to Keychain PascalCase authority types.
 */
function toKeychainAuthType(
  keyType: "posting" | "active" | "owner" | "memo"
): "Posting" | "Active" | "Owner" | "Memo" {
  switch (keyType) {
    case "posting":
      return "Posting";
    case "active":
      return "Active";
    case "owner":
      return "Owner";
    case "memo":
      return "Memo";
  }
}

/**
 * Self-hosted platform adapter for SDK mutations.
 *
 * Bridges the SDK's authentication context with the self-hosted app's
 * Zustand auth store and three supported auth methods (keychain, hivesigner, hiveauth).
 */
export function createBroadcastAdapter(): PlatformAdapter {
  return {
    async getUser(username: string) {
      const { user } = authenticationStore.getState();
      if (!user || user.username !== username) {
        return undefined;
      }
      return {
        name: user.username,
        authType: user.loginType,
      };
    },

    async getPostingKey() {
      // Self-hosted app never stores private keys
      return null;
    },

    async getAccessToken(username: string) {
      const { user } = authenticationStore.getState();
      if (!user || user.username !== username) {
        return undefined;
      }
      return user.accessToken;
    },

    async getLoginType(username: string) {
      const { user } = authenticationStore.getState();
      if (!user || user.username !== username) {
        return null;
      }
      // Self-hosted loginType values match SDK auth methods directly
      return user.loginType;
    },

    showError(message: string) {
      console.error("[SelfHosted]", message);
    },

    showSuccess(message: string) {
      console.log("[SelfHosted]", message);
    },

    async broadcastWithKeychain(
      username: string,
      ops: Operation[],
      keyType: "posting" | "active" | "owner" | "memo"
    ): Promise<TransactionConfirmation> {
      if (!isKeychainAvailable()) {
        throw new Error("Hive Keychain extension is unavailable or disabled.");
      }

      const response = await keychainBroadcast(
        username,
        ops,
        toKeychainAuthType(keyType)
      );

      // KeychainResponse.result contains the transaction confirmation
      return response.result as unknown as TransactionConfirmation;
    },

    async broadcastWithHiveAuth(
      username: string,
      ops: Operation[],
      _keyType: "posting" | "active" | "owner" | "memo"
    ): Promise<TransactionConfirmation> {
      const { session } = authenticationStore.getState();
      if (!session) {
        throw new Error("No HiveAuth session available");
      }

      // broadcastWithHiveAuth returns void (broadcast happens server-side)
      await broadcastWithHiveAuth(session, ops);

      // HiveAuth broadcasts server-side and doesn't return tx confirmation
      return {} as TransactionConfirmation;
    },

    async invalidateQueries(queryKeys: any[]) {
      await Promise.all(
        queryKeys
          .filter(Boolean)
          .map((entry) =>
            entry && typeof entry === "object" && "predicate" in entry
              ? queryClient.invalidateQueries({ predicate: entry.predicate })
              : queryClient.invalidateQueries({ queryKey: entry })
          )
      );
    },
  };
}
