import type { AuthContext } from "@ecency/sdk";
import type { User } from "@/entities";
import * as keychain from "@/utils/keychain";
import { broadcastWithHiveAuth, shouldUseHiveAuth } from "@/utils/hive-auth";
import { getUser } from "@/utils/user-token";

export function getSdkAuthContext(
  activeUser?: User | { username: string },
  username?: string
): AuthContext | undefined {
  if (!activeUser) {
    return undefined;
  }

  const resolvedUser =
    "accessToken" in activeUser
      ? (activeUser as User)
      : getUser(activeUser.username);

  if (!resolvedUser) {
    return undefined;
  }

  if (username && resolvedUser.username !== username) {
    return undefined;
  }

  const auth: AuthContext = {
    accessToken: resolvedUser.accessToken,
    postingKey: resolvedUser.postingKey,
    loginType: resolvedUser.loginType,
  };

  if (resolvedUser.loginType === "keychain") {
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
        .broadcast(resolvedUser.username, operations, keychainAuthority)
        .then((result: any) => result.result);
    };
  }

  if (resolvedUser.loginType === "hiveauth" || shouldUseHiveAuth(resolvedUser.username)) {
    auth.broadcast = (operations, authority = "posting") => {
      if (authority === "active" || authority === "posting") {
        return broadcastWithHiveAuth(resolvedUser.username, operations, authority);
      }
      throw new Error(`[SDK][Auth] – unsupported authority "${authority}" for HiveAuth`);
    };
  }

  return auth;
}
