import {
  useMutation,
  type MutationKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { Operation, PrivateKey } from "@hiveio/dhive";
import { CONFIG, getBoundFetch } from "@/modules/core";
//import hs from "hivesigner";
import { Keychain } from "@/modules/keychain";

export function useBroadcastMutation<T>(
  mutationKey: MutationKey = [],
  username: string | undefined,
  accessToken: string | undefined,
  operations: (payload: T) => Operation[],
  onSuccess: UseMutationOptions<unknown, Error, T>["onSuccess"] = () => {},
  auth?: {
    postingKey?: string | null;
    loginType?: string | null;
  }
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

      const postingKey = auth?.postingKey;
      if (postingKey) {
        const privateKey = PrivateKey.fromString(postingKey);

        return CONFIG.hiveClient.broadcast.sendOperations(
          operations(payload),
          privateKey
        );
      }

      const loginType = auth?.loginType;
      if (loginType && loginType == "keychain") {
        return Keychain.broadcast(
          username,
          operations(payload),
          "Posting"
        ).then((r: any) => r.result);
      }

      // With hivesigner access token
      if (accessToken) {
        const f = getBoundFetch();
        const res = await f("https://hivesigner.com/api/broadcast", {
          method: "POST",
          headers: {
            Authorization: accessToken,
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
