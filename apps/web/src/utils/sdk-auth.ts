import type { AuthContext } from "@ecency/sdk";
import type { User } from "@/entities";
import * as keychain from "@/utils/keychain";
import { broadcastWithHiveAuth, shouldUseHiveAuth } from "@/utils/hive-auth";

export function getSdkAuthContext(user?: User): AuthContext | undefined {
  if (!user) {
    return undefined;
  }

  const auth: AuthContext = {
    accessToken: user.accessToken,
    postingKey: user.postingKey,
    loginType: user.loginType,
  };

  // Check HiveAuth first (takes precedence)
  if (user.loginType === "hiveauth" || shouldUseHiveAuth(user.username)) {
    auth.broadcast = (operations, authority = "posting") => {
      if (authority === "active" || authority === "posting") {
        return broadcastWithHiveAuth(user.username, operations, authority);
      }
      throw new Error(`[SDK][Auth] – unsupported authority "${authority}" for HiveAuth`);
    };
  }
  // Set up keychain broadcast only when explicitly using keychain
  else if (user.loginType === "keychain") {
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
        .broadcast(user.username, operations, keychainAuthority)
        .then((result: any) => result.result);
    };
  }
  // hivesigner, privateKey, and undefined loginType don't need auth.broadcast setup
  // (hivesigner uses hs.sendOperation directly, privateKey uses key directly)

  return auth;
}
