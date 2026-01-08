import { Operation } from "@hiveio/dhive";
import { useMutation } from "@tanstack/react-query";
import type { AuthContext } from "@/modules/core/types";

export function useSignOperationByKeychain(
  username: string | undefined,
  auth?: AuthContext,
  keyType: "owner" | "active" | "posting" | "memo" = "active"
) {
  return useMutation({
    mutationKey: ["operations", "sign-keychain", username],
    mutationFn: ({ operation }: { operation: Operation }) => {
      if (!username) {
        throw new Error(
          "[SDK][Keychain] – cannot sign operation with anon user"
        );
      }
      if (!auth?.broadcast) {
        throw new Error("[SDK][Keychain] – missing keychain broadcaster");
      }

      return auth.broadcast([operation], keyType);
    },
  });
}
