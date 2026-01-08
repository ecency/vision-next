import {
  useMutation,
  type MutationKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { Operation, PrivateKey } from "@hiveio/dhive";
import { CONFIG } from "@/modules/core";
import type { AuthContext } from "@/modules/core/types";
import hs from "hivesigner";

export function useBroadcastMutation<T>(
  mutationKey: MutationKey = [],
  username: string | undefined,
  operations: (payload: T) => Operation[],
  onSuccess: UseMutationOptions<unknown, Error, T>["onSuccess"] = () => {},
  auth?: AuthContext
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

      if (auth?.broadcast) {
        return auth.broadcast(operations(payload), auth, "Posting");
      }

      const postingKey = auth?.postingKey;
      if (postingKey) {
        const privateKey = PrivateKey.fromString(postingKey);

        return CONFIG.hiveClient.broadcast.sendOperations(
          operations(payload),
          privateKey
        );
      }

      const accessToken = auth?.accessToken;
      if (accessToken) {
        const response = await new hs.Client({ accessToken }).broadcast(
          operations(payload)
        );
        return response.result;
      }

      throw new Error(
        "[SDK][Broadcast] – cannot broadcast w/o posting key or token"
      );
    },
  });
}
