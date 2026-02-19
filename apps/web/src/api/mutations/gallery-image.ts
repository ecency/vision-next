"use client";

import { useMutation } from "@tanstack/react-query";
import { useDeleteImageMutation } from "@/api/sdk-mutations";

export function useDeleteGalleryImage() {
  const sdkDeleteImage = useDeleteImageMutation();

  return useMutation({
    mutationKey: ["gallery", "image", "delete"],
    mutationFn: async ({ id }: { id: string }) => {
      await sdkDeleteImage.mutateAsync({ imageId: id });
      return id;
    }
  });
}
