import { useGalleryImagesQuery } from "@/api/queries";
import { proxifyImageSrc } from "@ecency/render-helper";
import React, { useMemo } from "react";
import { LinearProgress, success } from "@/features/shared";
import { useGlobalStore } from "@/core/global-store";
import i18next from "i18next";
import { UserImage } from "@/api/private-api";
import { clipboard } from "@/utils/clipboard";
import { useDeleteGalleryImage } from "@/api/mutations";
import useMount from "react-use/lib/useMount";
import { PopoverConfirm } from "@ui/popover-confirm";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";

interface Props {
  onPick?: (image: string) => void;
}

export function GalleryList({ onPick }: Props) {
  const canUseWebp = useGlobalStore((state) => state.canUseWebp);

  const { data, refetch, isPending } = useGalleryImagesQuery();
  const items = useMemo(
    () =>
      data?.sort((a, b) =>
        new Date(b.created).getTime() > new Date(a.created).getTime() ? 1 : -1
      ) ?? [],
    [data]
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
        </div>
      )}
      {!isPending && items.length === 0 && (
        <div className="gallery-list">{i18next.t("g.empty-list")}</div>
      )}
    </div>
  );
}
