import { getImagesInfiniteQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { proxifyImageSrc } from "@ecency/render-helper";
import React, { useMemo } from "react";
import { LinearProgress, success } from "@/features/shared";
import { useGlobalStore } from "@/core/global-store";
import i18next from "i18next";
import { UserImage } from "@ecency/sdk";
import { clipboard } from "@/utils/clipboard";
import { useDeleteGalleryImage } from "@/api/mutations";
import useMount from "react-use/lib/useMount";
import { PopoverConfirm } from "@ui/popover-confirm";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { getAccessToken } from "@/utils";

interface Props {
  onPick?: (image: string) => void;
}

export function GalleryList({ onPick }: Props) {
  const canUseWebp = useGlobalStore((state) => state.canUseWebp);
  const { activeUser } = useActiveAccount();

  const {
    data,
    refetch,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    getImagesInfiniteQueryOptions(
      activeUser?.username,
      getAccessToken(activeUser?.username ?? ""),
      10
    )
  );

  const allImages = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const items = useMemo(
    () =>
      allImages.sort((a, b) =>
        new Date(b.created).getTime() > new Date(a.created).getTime() ? 1 : -1
      ),
    [allImages]
  );

  const { mutateAsync: deleteImage } = useDeleteGalleryImage();

  useMount(() => {
    refetch();
  });

  const itemClicked = (item: UserImage) => {
    if (onPick) {
      onPick(item.url);
      return;
    }

    clipboard(item.url);
    success(i18next.t("gallery.copied"));
  };

  return (
    <div className="dialog-content">
      {isPending && <LinearProgress />}
      {items.length > 0 && (
        <div className="gallery-list">
          <div className="gallery-list-body">
            {items.map((item) => {
              const src = proxifyImageSrc(item.url, 600, 500, canUseWebp ? "webp" : "match");
              return (
                <div
                  className="gallery-list-item"
                  style={{ backgroundImage: `url('${src}')` }}
                  key={item._id}
                >
                  <div className="item-inner" onClick={() => itemClicked(item)} />
                  <div className="item-controls">
                    <PopoverConfirm onConfirm={() => deleteImage({ id: item._id })}>
                      <Button
                        icon={<UilTrash className="w-3 h-3" />}
                        size="xs"
                        appearance="danger"
                      />
                    </PopoverConfirm>
                  </div>
                </div>
              );
            })}
          </div>
          {hasNextPage && (
            <div className="flex justify-center my-4">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                isLoading={isFetchingNextPage}
              >
                {isFetchingNextPage ? i18next.t("g.loading") : i18next.t("g.load-more")}
              </Button>
            </div>
          )}
        </div>
      )}
      {!isPending && items.length === 0 && (
        <div className="gallery-list">{i18next.t("g.empty-list")}</div>
      )}
    </div>
  );
}
