import { useMutation } from "@tanstack/react-query";
import defaults from "@/defaults";
import { appAxios } from "@/api/axios";
import { getAccessToken } from "@/utils";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, success } from "@/features/shared";
import i18next from "i18next";

export function useImageUpload() {
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["upload-image"],
    mutationFn: async ({ file, signal }: { file: File; signal?: AbortSignal }) => {
      const fData = new FormData();
      fData.append("file", file);

      const token = getAccessToken(activeUser!.username);
      const postUrl = `${defaults.imageServer}/hs/${token}`;

      const r = await appAxios.post(postUrl, fData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        signal
      });
      return r.data;
    },
    onSuccess: () => success(i18next.t("image-upload-button.uploaded")),
    onError: () => error(i18next.t("g.server-error"))
  });
}
