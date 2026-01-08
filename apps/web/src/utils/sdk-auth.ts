import type { AuthContext } from "@ecency/sdk";
import type { User } from "@/entities";
import * as keychain from "@/utils/keychain";
import { broadcastWithHiveAuth, shouldUseHiveAuth } from "@/utils/hive-auth";

export function getSdkAuthContext(
  activeUser?: User,
  username?: string
): AuthContext | undefined {
  if (!activeUser) {
    return undefined;
  }

  if (username && activeUser.username !== username) {
    return undefined;
  }

  const auth: AuthContext = {
    accessToken: activeUser.accessToken,
    postingKey: activeUser.postingKey,
    loginType: activeUser.loginType,
  };

  if (activeUser.loginType === "keychain") {
    auth.broadcast = (operations, authority = "posting") => {
      const keychainAuthority =
        authority === "active"
          ? "Active"
          : authority === "posting"
            ? "Posting"
            : authority === "owner"
              ? "Owner"
              : "Memo";
      return keychain
        .broadcast(activeUser.username, operations, keychainAuthority)
        .then((result: any) => result.result);
    };
  }

  if (activeUser.loginType === "hiveauth" || shouldUseHiveAuth(activeUser.username)) {
    auth.broadcast = (operations, authority = "posting") => {
      if (authority === "active" || authority === "posting") {
        return broadcastWithHiveAuth(activeUser.username, operations, authority);
      }
      throw new Error(`[SDK][Auth] – unsupported authority "${authority}" for HiveAuth`);
    };
  }

  return auth;
}
