import React, { useMemo } from "react";
import { Entry } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { useImageDownloader } from "@/api/queries";
import { EntryLink } from "@/features/shared";
import { catchPostImage } from "@ecency/render-helper";
import Image from "next/image";

interface Props {
  entry: Entry;
  noImage: string;
  isCrossPost: boolean;
  entryProp: Entry;
}

export function EntryListItemThumbnail({ entry, noImage, isCrossPost, entryProp }: Props) {
  const listStyle = useGlobalStore((state) => state.listStyle);

  const { data: imgGrid, isLoading: isGridLoading } = useImageDownloader(
    entry,
    noImage,
    600,
    500,
    listStyle === "grid",
    false
  );
  const { data: imgRow, isLoading: isRowLoading } = useImageDownloader(
    entry,
    noImage,
    260,
    200,
    listStyle !== "grid",
    false
  );

  const blurUrl = useMemo(() => {
    const url = catchPostImage(entry, 0, 0);
    if (!url) return null;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}blur=1`;
  }, [entry]);

  const isGrid = listStyle === "grid";
  const img = isGrid ? imgGrid : imgRow;
  const isLoading = isGrid ? isGridLoading : isRowLoading;
  const hasFullImage = !!img && img !== noImage;

  const showImage = useMemo(() => {
    const isComment = !!entry.parent_permlink && entry.parent_permlink !== entry.permlink;
    const hasImage = !!imgGrid || !!imgRow;
    return !isComment || hasImage;
  }, [entry.parent_permlink, entry.permlink, imgGrid, imgRow]);

  return (
    showImage && (
      <div className={"item-image " + (!hasFullImage ? "noImage" : "")}>
        <EntryLink className="h-full" entry={isCrossPost ? entryProp : entry}>
          <div className="h-full w-full relative overflow-hidden">
            {blurUrl && (
              <img
                src={blurUrl}
                alt=""
                aria-hidden="true"
                className={
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 " +
                  (hasFullImage ? "opacity-0" : "opacity-100")
                }
              />
            )}
            {isGrid ? (
              <Image
                width={1000}
                height={1000}
                className={
                  "w-full h-full object-cover mx-auto relative transition-opacity duration-300 " +
                  (hasFullImage ? "opacity-100" : blurUrl ? "opacity-0" : "")
                }
                src={img || noImage}
                alt={isLoading ? "" : entry.title}
              />
            ) : (
              <img
                className={
                  "w-full relative transition-opacity duration-300 " +
                  (hasFullImage ? "opacity-100" : blurUrl ? "opacity-0" : "")
                }
                src={img || noImage}
                alt={isLoading ? "" : entry.title}
              />
            )}
          </div>
        </EntryLink>
      </div>
    )
  );
}
