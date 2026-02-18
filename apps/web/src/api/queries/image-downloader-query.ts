import { Entry } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { catchPostImage } from "@ecency/render-helper";
import { appAxios } from "@/api/axios";

export function useImageDownloader(
  entry: Entry,
  noImage: string,
  width: number,
  height: number,
  enabled: boolean,
  useFallback = true
) {
  const blobToBase64 = (blob: Blob) => {
    const reader = new FileReader();

    reader.readAsDataURL(blob);

    return new Promise((resolve, reject) => {
      reader.onloadend = function () {
        const base64data = reader.result;
        resolve(base64data);
      };
      reader.onerror = function (e) {
        reject(e);
      };
    });
  };

  return useQuery({
    queryKey: [QueryIdentifiers.ENTRY_THUMB, entry.author, entry.permlink, width, height],
    queryFn: async () => {
      try {
        const response = await appAxios.get(
          catchPostImage(entry, width, height),
          {
            responseType: "blob"
          }
        );
        const data = (await blobToBase64(response.data)) as string;

        if (data) {
          return data;
        } else if (useFallback) {
          const response = await appAxios.get(noImage, {
            responseType: "blob"
          });
          return (await blobToBase64(response.data)) as string;
        }

        return "";
      } catch (e) {
        return useFallback ? noImage : "";
      }
    },
    enabled,
    retryDelay: 3000
  });
}
