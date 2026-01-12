import { useMutation } from "@tanstack/react-query";
import { hsTokenRenew } from "@ecency/sdk";

export function useHsLoginRefresh() {
  return useMutation({
    mutationKey: ["hs-token-refresh"],
    mutationFn: ({ code }: { code: string }) => hsTokenRenew(code)
  });
}
