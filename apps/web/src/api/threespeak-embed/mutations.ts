"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { uploadVideoEmbed } from "./api";
import { VideoUploadResult } from "./types";
import { error } from "@/features/shared";

export function useThreeSpeakEmbedUpload() {
  const [completed, setCompleted] = useState<number>(0);

  const mutation = useMutation({
    mutationKey: ["threeSpeakEmbedUpload"],
    mutationFn: async ({
      file,
      owner,
      isShort = false
    }: {
      file: File;
      owner: string;
      isShort?: boolean;
    }): Promise<VideoUploadResult> => {
      try {
        const result = await uploadVideoEmbed(file, owner, isShort, (percentage) =>
          setCompleted(percentage)
        );
        return result;
      } catch (e) {
        const status =
          (e as any)?.originalResponse?.getStatus?.() ??
          (e instanceof Error && "status" in e ? (e as any).status : undefined);

        if (status === 413) {
          error("Video file is too large. Please use a smaller file.");
        } else if (status === 429) {
          error("Too many upload requests. Please wait a moment and try again.");
        } else if (status === 503) {
          error("Upload service is temporarily unavailable. Please try again later.");
        } else if (status === 401 || status === 403) {
          error("Authentication failed. Please contact support.");
        } else {
          error("Failed to upload video. Please try again.");
        }
        throw e;
      } finally {
        setCompleted(0);
      }
    }
  });

  return { ...mutation, completed, setCompleted };
}
