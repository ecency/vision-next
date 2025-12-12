import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { getImages } from "@/api/private-api";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useGalleryImagesQuery() {
  const { activeUser } = useActiveAccount();

  return useQuery({
    queryKey: [QueryIdentifiers.GALLERY_IMAGES, activeUser?.username],
    queryFn: () => getImages(activeUser!.username),
    enabled: !!activeUser
  });
}
