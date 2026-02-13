import { useMutation } from "@tanstack/react-query";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { PrivateKey } from "@hiveio/dhive";
import { usePromoteMutation } from "@/api/sdk-mutations";

/**
 * Legacy hook for promoting posts via Keychain.
 * Now delegates to SDK mutation for unified auth handling.
 *
 * @deprecated Use usePromoteMutation() from sdk-mutations instead
 */
export function usePromoteByKeychain() {
  const { mutateAsync: promote } = usePromoteMutation();

  return useMutation({
    mutationKey: ["promote-by-keychain"],
    mutationFn: ({ path, duration }: { path: string; duration: number }) => {
      const [author, permlink] = path.replace("@", "").split("/");
      return promote({ author, permlink, duration });
    },
    onError: (err) => error(...formatError(err))
  });
}

/**
 * Legacy hook for promoting posts via API/private key.
 * Now delegates to SDK mutation for unified auth handling.
 *
 * @deprecated Use usePromoteMutation() from sdk-mutations instead
 */
export function usePromoteByApi() {
  const { mutateAsync: promote } = usePromoteMutation();

  return useMutation({
    mutationKey: ["promote-by-api"],
    mutationFn: ({ path, duration, key }: { path: string; duration: number; key: PrivateKey }) => {
      const [author, permlink] = path.replace("@", "").split("/");
      return promote({ author, permlink, duration });
    },
    onError: (err) => error(...formatError(err))
  });
}
