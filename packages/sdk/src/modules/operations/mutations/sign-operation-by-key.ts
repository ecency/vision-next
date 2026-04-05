import { PrivateKey } from "@ecency/hive-tx";
import type { Operation } from "@ecency/hive-tx";
import { isWif, broadcastOperations } from "@/modules/core/hive-tx";
import { useMutation } from "@tanstack/react-query";

export function useSignOperationByKey(username: string | undefined) {
  return useMutation({
    mutationKey: ["operations", "sign", username],
    mutationFn: ({
      operation,
      keyOrSeed,
    }: {
      operation: Operation;
      keyOrSeed: string;
    }) => {
      if (!username) {
        throw new Error("[Operations][Sign] – cannot sign op with anon user");
      }

      let privateKey: PrivateKey;
      if (keyOrSeed.split(" ").length === 12) {
        privateKey = PrivateKey.fromLogin(username, keyOrSeed, "active");
      } else if (isWif(keyOrSeed)) {
        privateKey = PrivateKey.fromString(keyOrSeed);
      } else {
        privateKey = PrivateKey.from(keyOrSeed);
      }

      return broadcastOperations(
        [operation],
        privateKey
      );
    },
  });
}
