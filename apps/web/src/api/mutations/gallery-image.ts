"use client";

import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteImage, UserImage } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { QueryIdentifiers } from "@/core/react-query";
import { getAccessToken } from "@/utils";
import { WrappedResponse } from "@ecency/sdk";

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
      // Update regular query cache
      queryClient.setQueryData<UserImage[]>(
        [QueryIdentifiers.GALLERY_IMAGES, activeUser?.username],
        (
          queryClient.getQueryData<UserImage[]>([
            QueryIdentifiers.GALLERY_IMAGES,
            activeUser?.username
          ]) ?? []
        ).filter((image) => image._id !== id)
      );

      // Update infinite query cache - remove image from all pages
      queryClient.setQueriesData<InfiniteData<WrappedResponse<UserImage>>>(
        { queryKey: ["posts", "images", "infinite", activeUser?.username] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.filter((image) => image._id !== id),
            })),
          };
        }
      );
    }
  });
}
