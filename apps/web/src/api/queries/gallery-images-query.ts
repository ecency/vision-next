import { useQuery } from "@tanstack/react-query";
import { getGalleryImagesQueryOptions } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useGalleryImagesQuery() {
  const { activeUser } = useActiveAccount();

  return useQuery(getGalleryImagesQueryOptions(activeUser?.username));
}
