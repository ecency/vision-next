import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { uploadFile, uploadVideoInfo } from "./api";
import { useThreeSpeakVideo } from "./queries";
import { QueryIdentifiers } from "@/core/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error } from "@/features/shared";
import axios from "axios";

export function useThreeSpeakVideoUpload(type: "video" | "thumbnail") {
  const [completed, setCompleted] = useState<number>(0);

  const mutation = useMutation({
    mutationKey: ["threeSpeakVideoUpload", type],
    mutationFn: async ({ file }: { file: File }) => {
      try {
        return uploadFile(file, type, (percentage) => setCompleted(percentage));
      } catch (e) {
        console.error(e);
        // Enhanced error handling
        if (axios.isAxiosError(e)) {
          const status = e.response?.status;
          if (status === 413) {
            error(`${type === "video" ? "Video" : "Thumbnail"} file is too large. Please use a smaller file.`);
          } else if (status === 429) {
            error("Too many upload requests. Please wait a moment and try again.");
          } else if (status === 503) {
            error("Upload service is temporarily unavailable. Please try again later.");
          } else if (status === 401 || status === 403) {
            error("Authentication expired. Please refresh the page and try again.");
          } else {
            error(`Failed to upload ${type}. Please try again.`);
          }
        } else {
          error(`Failed to upload ${type}. Please try again.`);
        }
        throw e;
      } finally {
        setCompleted(0);
      }
    }
  });

  return { ...mutation, completed, setCompleted };
}

export function useUploadVideoInfo() {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();
  const { data, refetch } = useThreeSpeakVideo("all");

  return useMutation({
    mutationKey: ["threeSpeakVideoUploadInfo"],
    mutationFn: async ({
      fileName,
      fileSize,
      videoUrl,
      thumbUrl,
      activeUser,
      duration
    }: {
      fileName: string;
      fileSize: number;
      videoUrl: string;
      thumbUrl: string;
      activeUser: string;
      duration: number;
    }) => {
      try {
        return await uploadVideoInfo(fileName, fileSize, videoUrl, thumbUrl, activeUser, duration);
      } catch (e) {
        console.error(e);
        // Enhanced error handling
        if (axios.isAxiosError(e)) {
          const status = e.response?.status;
          if (status === 429) {
            error("Too many requests. Please wait a moment and try again.");
          } else if (status === 503) {
            error("Video service is temporarily unavailable. Please try again later.");
          } else if (status === 401 || status === 403) {
            error("Authentication expired. Please refresh the page and try again.");
          } else {
            error("Failed to save video information. Please try again.");
          }
        } else {
          error("Failed to save video information. Please try again.");
        }
        throw e;
      }
    },
    onSuccess: async (response) => {
      if (response) {
        let current = data;
        if (current.length === 0) {
          const response = await refetch();
          current = response.data ?? [];
        }

        const next = [response, ...current];
        queryClient.setQueryData(
          [QueryIdentifiers.THREE_SPEAK_VIDEO_LIST, activeUser?.username ?? ""],
          next
        );
      }
    }
  });
}
