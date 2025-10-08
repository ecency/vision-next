import { CONFIG } from "@/modules/core/config";
import { cryptoUtils, Operation, PrivateKey } from "@hiveio/dhive";
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
      } else if (cryptoUtils.isWif(keyOrSeed)) {
        privateKey = PrivateKey.fromString(keyOrSeed);
      } else {
        privateKey = PrivateKey.from(keyOrSeed);
      }

      return CONFIG.hiveClient.broadcast.sendOperations(
        [operation],
        privateKey
      );
    },
  });
}
