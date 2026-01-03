import { EcencyQueriesManager } from "@/core/react-query";
import { getImagesQueryOptions } from "@ecency/sdk";

export const getImagesQuery = (username?: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    ...getImagesQueryOptions(username),
    select: (items) =>
      items.sort((a, b) => {
        return new Date(b.created).getTime() > new Date(a.created).getTime() ? 1 : -1;
      }),
  });
