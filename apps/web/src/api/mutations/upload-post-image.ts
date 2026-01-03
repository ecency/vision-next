"use client";

import { useMutation } from "@tanstack/react-query";
import { uploadImage } from "../misc";
import { addImage } from "../private-api";
import axios from "axios";
import { getAccessToken } from "@/utils";
import { error, success } from "@/features/shared";
import i18next from "i18next";
import { EcencyConfigManager } from "@/config";
import useConditionalMutation = EcencyConfigManager.useConditionalMutation;
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useUploadPostImage() {
  const { activeUser } = useActiveAccount();

  const { mutateAsync: upload } = useMutation({
    mutationKey: ["uploadPostImage"],
    mutationFn: async ({ file, signal }: { file: File; signal?: AbortSignal }) => {
      const username = activeUser?.username!;
      let token = getAccessToken(username);

      if (!token) {
        error(i18next.t("editor-toolbar.image-error-cache"));
        throw new Error("Token missed");
      }

      return uploadImage(file, token, signal);
    },
    onError: (e: Error) => {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        if (status === 413) {
          error(i18next.t("editor-toolbar.image-error-size"));
        } else if (status === 429) {
          error("Too many upload requests. Please wait a moment and try again.");
        } else if (status === 503) {
          error("Image upload service is temporarily unavailable. Please try again later.");
        } else if (status === 401 || status === 403) {
          error("Authentication expired. Please refresh the page and try again.");
        } else {
          error(i18next.t("editor-toolbar.image-error"));
        }
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
    mutationFn: async ({ file, signal }: { file: File; signal?: AbortSignal }) => {
      const response = await upload({ file, signal });
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
