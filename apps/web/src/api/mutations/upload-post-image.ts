import { useMutation } from "@tanstack/react-query";
import { uploadImage } from "../misc";
import { addImage } from "../private-api";
import axios from "axios";
import { useGlobalStore } from "@/core/global-store";
import { getAccessToken } from "@/utils";
import { error, success } from "@/features/shared";
import i18next from "i18next";
import { EcencyConfigManager } from "@/config";
import useConditionalMutation = EcencyConfigManager.useConditionalMutation;

export function useUploadPostImage() {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { mutateAsync: upload } = useMutation({
    mutationKey: ["uploadPostImage"],
    mutationFn: async ({ file }: { file: File }) => {
      const username = activeUser?.username!;
      let token = getAccessToken(username);

      if (!token) {
        error(i18next.t("editor-toolbar.image-error-cache"));
        throw new Error("Token missed");
      }

      return uploadImage(file, token);
    },
    onError: (e: Error) => {
      if (axios.isAxiosError(e) && e.response?.status === 413) {
        error(i18next.t("editor-toolbar.image-error-size"));
      } else if (e.message === "Token missed") {
        error(i18next.t("g.image-error-cache"));
      } else {
        error(i18next.t("editor-toolbar.image-error"));
      }
    }
  });

  const { mutateAsync: add } = useConditionalMutation(
    ({ visionFeatures }) => visionFeatures.imageServer.enabled,
    {
      mutationKey: ["addPostImage"],
      mutationFn: async ({ url }: { url: string }) => {
        const username = activeUser?.username!;
        let token = getAccessToken(username);

        if (!token) {
          error(i18next.t("editor-toolbar.image-error-cache"));
          throw new Error("Token missed");
        }

        if (url.length > 0) {
          await addImage(username, url);
          return;
        }

        throw new Error("URL missed");
      },
      onError: (e: Error) => {
        if (axios.isAxiosError(e)) {
          error(i18next.t("editor-toolbar.image-error-network"));
        } else if (e.message === "Token missed") {
          error(i18next.t("g.image-error-cache"));
        } else if (e.message === "URL missed") {
          error(i18next.t("editor-toolbar.image-error-url-missed"));
        } else {
          error(i18next.t("editor-toolbar.image-error"));
        }
      }
    }
  );

  return useMutation({
    mutationKey: ["uploadAndAddPostImage"],
    mutationFn: async ({ file }: { file: File }) => {
      const response = await upload({ file });
      try {
        await add(response);
      } catch (e) {
        // images-add failure shouldn't block using the uploaded image
      }
      return response;
    },
    onSuccess: () => {
      success(i18next.t("ecency-images.success-upload"));
    }
  });
}
