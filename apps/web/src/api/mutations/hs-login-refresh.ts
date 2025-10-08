import { useMutation } from "@tanstack/react-query";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";

export function useHsLoginRefresh() {
  return useMutation({
    mutationKey: ["hs-token-refresh"],
    mutationFn: async ({ code }: { code: string }) => {
      const response = await appAxios.post(apiBase(`/auth-api/hs-token-refresh`), {
        code
      });
      return response.data;
    }
  });
}
