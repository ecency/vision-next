import { Keychain } from "@/modules/keychain";
import { Operation } from "@hiveio/dhive";
import { useMutation } from "@tanstack/react-query";

export function useSignOperationByKeychain(
  username: string | undefined,
  keyType: Keychain.KeychainAuthorityTypes = "Active"
) {
  return useMutation({
    mutationKey: ["operations", "sign-keychain", username],
    mutationFn: ({ operation }: { operation: Operation }) => {
      if (!username) {
        throw new Error(
          "[SDK][Keychain] – cannot sign operation with anon user"
        );
      }
      return Keychain.broadcast(username, [operation], keyType) as Promise<any>;
    },
  });
}
