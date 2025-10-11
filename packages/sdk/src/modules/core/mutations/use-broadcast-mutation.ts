import {
  useMutation,
  type MutationKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getAccessToken, getLoginType, getPostingKey } from "../storage";
import { Operation, PrivateKey } from "@hiveio/dhive";
import { CONFIG } from "@/modules/core/config";
//import hs from "hivesigner";
import { Keychain } from "@/modules/keychain";

const getBoundFetch = (): typeof fetch => {
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return window.fetch.bind(window);
  }
  return globalThis.fetch;
};
export function useBroadcastMutation<T>(
  mutationKey: MutationKey = [],
  username: string | undefined,
  operations: (payload: T) => Operation[],
  onSuccess: UseMutationOptions<unknown, Error, T>["onSuccess"] = () => {}
) {
  return useMutation({
    onSuccess,
    mutationKey: [...mutationKey, username],
    mutationFn: async (payload: T) => {
      if (!username) {
        throw new Error(
          "[Core][Broadcast] Attempted to call broadcast API with anon user"
        );
      }

      const postingKey = getPostingKey(username);
      if (postingKey) {
        const privateKey = PrivateKey.fromString(postingKey);

        return CONFIG.hiveClient.broadcast.sendOperations(
          operations(payload),
          privateKey
        );
      }

      const loginType = getLoginType(username);
      if (loginType && loginType == "keychain") {
        return Keychain.broadcast(
          username,
          operations(payload),
          "Posting"
        ).then((r: any) => r.result);
      }

      // With hivesigner access token
      let token = getAccessToken(username);
      if (token) {
        const f = getBoundFetch();
        const res = await f("https://hivesigner.com/api/broadcast", {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ operations: operations(payload) }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`[Hivesigner] ${res.status} ${res.statusText} ${txt}`);
        }

        const json = await res.json();
        if (json?.errors) {
          throw new Error(`[Hivesigner] ${JSON.stringify(json.errors)}`);
        }
        return json.result;
      }

      throw new Error(
        "[SDK][Broadcast] – cannot broadcast w/o posting key or token"
      );
    },
  });
}
