import { getImagesQueryOptions } from "@ecency/sdk";

export const getImagesQuery = (username?: string) => ({
  ...getImagesQueryOptions(username),
  select: (items: any[]) =>
    items.sort((a, b) => {
      return new Date(b.created).getTime() > new Date(a.created).getTime() ? 1 : -1;
    })
});
