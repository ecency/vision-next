import {
  useMutation,
  type MutationKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getAccessToken, getLoginType, getPostingKey } from "../storage";
import { Operation, PrivateKey } from "@hiveio/dhive";
import { CONFIG } from "@/modules/core/config";
import hs from "hivesigner";
import { Keychain } from "@/modules/keychain";

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
        const response = await new hs.Client({
          accessToken: token,
        }).broadcast(operations(payload));
        return response.result;
      }

      throw new Error(
        "[SDK][Broadcast] – cannot broadcast w/o posting key or token"
      );
    },
  });
}
