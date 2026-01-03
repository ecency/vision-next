import { EcencyQueriesManager } from "@/core/react-query";
import { getGalleryImagesQueryOptions } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useGalleryImagesQuery() {
  const { activeUser } = useActiveAccount();

  return EcencyQueriesManager.generateClientServerQuery(
    getGalleryImagesQueryOptions(activeUser?.username)
  ).useClientQuery();
}
