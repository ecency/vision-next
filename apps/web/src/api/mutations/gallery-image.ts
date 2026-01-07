"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteImage, UserImage } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { QueryIdentifiers } from "@/core/react-query";
import { getAccessToken } from "@/utils";

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["gallery", "image", "delete"],
    mutationFn: async ({ id }: { id: string }) => {
      if (!activeUser?.username) {
        throw new Error("Cannot delete image without an active user");
      }
      const token = getAccessToken(activeUser.username);
      if (!token) {
        throw new Error("Missing access token for image deletion");
      }
      await deleteImage(token, id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<UserImage[]>(
        [QueryIdentifiers.GALLERY_IMAGES, activeUser?.username],
        (
          queryClient.getQueryData<UserImage[]>([
            QueryIdentifiers.GALLERY_IMAGES,
            activeUser?.username
          ]) ?? []
        ).filter((image) => image._id !== id)
      );
    }
  });
}
