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
    auth.broadcast = (operations, _auth, authority = "Posting") =>
      keychain
        .broadcast(activeUser.username, operations, authority)
        .then((result: any) => result.result);
  }

  if (activeUser.loginType === "hiveauth" || shouldUseHiveAuth(activeUser.username)) {
    auth.broadcast = (operations, _auth, authority = "Posting") => {
      const keyType = authority === "Active" ? "active" : "posting";
      return broadcastWithHiveAuth(activeUser.username, operations, keyType);
    };
  }

  return auth;
}
