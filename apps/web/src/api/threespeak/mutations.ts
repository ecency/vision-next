import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { uploadFile, uploadVideoInfo } from "./api";
import { useThreeSpeakVideo } from "./queries";
import { QueryIdentifiers } from "@/core/react-query";
import { useGlobalStore } from "@/core/global-store";

export function useThreeSpeakVideoUpload(type: "video" | "thumbnail") {
  const [completed, setCompleted] = useState<number>(0);

  const mutation = useMutation({
    mutationKey: ["threeSpeakVideoUpload", type],
    mutationFn: async ({ file }: { file: File }) => {
      try {
        return uploadFile(file, type, (percentage) => setCompleted(percentage));
      } catch (e) {
        console.error(e);
      } finally {
        setCompleted(0);
      }
      return null;
    }
  });

  return { ...mutation, completed, setCompleted };
}

export function useUploadVideoInfo() {
  const queryClient = useQueryClient();
  const activeUser = useGlobalStore((state) => state.activeUser);
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
      }
      return null;
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
