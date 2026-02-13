"use client";

import { useUploadImage, useAddImage } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { error, success } from "@/features/shared";
import i18next from "i18next";
import { EcencyConfigManager } from "@/config";

/**
 * Web wrapper that combines SDK useUploadImage + useAddImage hooks.
 *
 * This hook:
 * 1. Uploads an image file to Ecency's image server (uses SDK hook)
 * 2. (Optionally) Adds the uploaded image URL to user's gallery if feature flag is enabled (uses SDK hook)
 * 3. Provides web-specific error handling for different HTTP status codes
 * 4. Shows success notification on completion
 *
 * @example
 * const uploadMutation = useUploadImageMutation();
 * uploadMutation.mutate({ file, signal });
 */
export function useUploadImageMutation() {
  const { activeUser } = useActiveAccount();
  const code = activeUser ? getAccessToken(activeUser.username) : undefined;

  // SDK hooks
  const sdkUpload = useUploadImage();
  const sdkAddImage = useAddImage(activeUser?.username, code);

  // Feature-flagged add mutation
  const conditionalAdd = EcencyConfigManager.useConditionalMutation(
    ({ visionFeatures }) => visionFeatures.imageServer.enabled,
    {
      mutationKey: ["addPostImage"],
      mutationFn: async ({ url }: { url: string }) => {
        if (!url || url.length === 0) {
          throw new Error("URL missed");
        }
        await sdkAddImage.mutateAsync({ url });
      },
      onError: (e: Error) => {
        // Web-specific error handling for add
        if ("status" in e) {
          error(i18next.t("editor-toolbar.image-error-network"));
        } else if (e.message === "Token missed") {
          error(i18next.t("g.image-error-cache"));
        } else if (e.message === "URL missed") {
          error(i18next.t("editor-toolbar.image-error-url-missed"));
        } else {
          error(i18next.t("editor-toolbar.image-error"));
        }
      },
    }
  );

  // Combine upload + add operations
  return useMutation({
    mutationKey: ["uploadAndAddPostImage"],
    mutationFn: async ({ file, signal }: { file: File; signal?: AbortSignal }) => {
      if (!activeUser?.username) {
        throw new Error("Cannot upload image without an active user");
      }

      const token = getAccessToken(activeUser.username);
      if (!token) {
        error(i18next.t("editor-toolbar.image-error-cache"));
        throw new Error("Token missed");
      }

      // Use SDK upload mutation
      const response = await sdkUpload.mutateAsync({ file, token, signal });

      // Try to add to gallery (non-blocking)
      try {
        await conditionalAdd.mutateAsync(response);
      } catch (e) {
        // images-add failure shouldn't block using the uploaded image
      }

      return response;
    },
    onSuccess: () => {
      success(i18next.t("ecency-images.success-upload"));
    },
    onError: (e: Error) => {
      // Web-specific error handling for upload
      if ("status" in e) {
        const status = (e as { status?: number }).status;
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
    },
  });
}
