"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserImage } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { QueryIdentifiers } from "@/core/react-query";
import { useDeleteImageMutation } from "@/api/sdk-mutations";

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();
  const sdkDeleteImage = useDeleteImageMutation();

  return useMutation({
    mutationKey: ["gallery", "image", "delete"],
    mutationFn: async ({ id }: { id: string }) => {
      // SDK mutation handles API call + SDK cache updates (regular + infinite)
      await sdkDeleteImage.mutateAsync({ imageId: id });
      return id;
    },
    onSuccess: (id) => {
      // Bridge: update web-specific cache key
      queryClient.setQueryData<UserImage[]>(
        [QueryIdentifiers.GALLERY_IMAGES, activeUser?.username],
        (prev) => (prev ?? []).filter((image) => image._id !== id)
      );
    }
  });
}
