"use client";

import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserImage } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { QueryIdentifiers } from "@/core/react-query";
import { WrappedResponse } from "@ecency/sdk";
import { useDeleteImageMutation } from "@/api/sdk-mutations";

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();
  const sdkDeleteImage = useDeleteImageMutation();

  return useMutation({
    mutationKey: ["gallery", "image", "delete"],
    mutationFn: async ({ id }: { id: string }) => {
      // Use SDK mutation for the actual API call
      await sdkDeleteImage.mutateAsync({ imageId: id });
      return id;
    },
    onSuccess: (id) => {
      // Web-specific cache management: handle BOTH web and SDK cache key patterns

      // 1. Update regular query cache (web pattern)
      queryClient.setQueryData<UserImage[]>(
        [QueryIdentifiers.GALLERY_IMAGES, activeUser?.username],
        (
          queryClient.getQueryData<UserImage[]>([
            QueryIdentifiers.GALLERY_IMAGES,
            activeUser?.username
          ]) ?? []
        ).filter((image) => image._id !== id)
      );

      // 2. Update SDK pattern regular cache (SDK already invalidates this, but we update it optimistically)
      queryClient.setQueryData<UserImage[]>(
        ["posts", "images", activeUser?.username],
        (
          queryClient.getQueryData<UserImage[]>([
            "posts", "images", activeUser?.username
          ]) ?? []
        ).filter((image) => image._id !== id)
      );

      // 3. Update infinite query cache (web pattern) - remove image from all pages
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
