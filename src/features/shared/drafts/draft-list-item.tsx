import React, { useMemo } from "react";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { PopoverConfirm } from "@ui/popover-confirm";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { Draft, FullAccount } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import fallbackImage from "../../../../public/assets/fallback.png";
import noImage from "@/assets/img/noimage.svg";
import { getCommunityCache } from "@/core/caches";
import { accountReputation, dateToFormatted, dateToFullRelative } from "@/utils";
import { UserAvatar } from "@/features/shared";
import Image from "next/image";
import { classNameObject } from "@ui/util";
import { cloneOutlineSvg, deleteForeverSvg, pencilOutlineSvg } from "@ui/svg";
import i18next from "i18next";
import { UilCopy, UilEditAlt, UilTrash } from "@tooni/iconscout-unicons-react";

interface Props {
  draft: Draft;
  editFn: (item: Draft, isNewEditor: boolean) => void;
  deleteFn: (item: Draft) => void;
  cloneFn: (item: Draft) => void;
}

export function DraftListItem({ draft, editFn, deleteFn, cloneFn }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const canUseWebp = useGlobalStore((state) => state.canUseWebp);

  const account = useMemo(() => activeUser?.data as FullAccount, [activeUser]);

  const author = account.name;
  const reputation = account.reputation;

  const tags = draft.tags ? draft.tags.split(/[ ,]+/) : [];
  const tag = tags[0] || "";
  const img = catchPostImage(draft.body, 600, 500, canUseWebp ? "webp" : "match") || noImage;
  const summary = postBodySummary(draft.body, 200);

  const { data: community } = getCommunityCache(tag).useClientQuery();

  const dateRelative = useMemo(() => dateToFullRelative(draft.created), [draft]);
  const dateFormatted = useMemo(() => dateToFormatted(draft.created), [draft]);

  return !activeUser?.data.__loaded ? null : (
    <div className="drafts-list-item border dark:border-dark-400 rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between border-b dark:border-dark-300 mb-4 p-2 bg-gray-100 dark:bg-dark-500">
        <div className="flex items-center gap-3">
          <Badge>{community?.title ?? tag}</Badge>
          <div className="text-sm text-gray-600" title={dateFormatted}>
            {dateRelative}
          </div>
        </div>

        <div className="flex items-center">
          <Button
            size="xs"
            appearance="gray-link"
            onClick={() => cloneFn(draft)}
            icon={<UilCopy />}
            title={i18next.t("g.clone")}
          />
          <PopoverConfirm
            onConfirm={() => {
              deleteFn(draft);
            }}
          >
            <Button
              size="xs"
              appearance="gray-link"
              icon={<UilTrash />}
              title={i18next.t("g.delete")}
            />
          </PopoverConfirm>
        </div>
      </div>
      <div className="grid gap-4 p-2 grid-cols-1 md:grid-cols-[150px_1fr]">
        <div className="w-full flex flex-col items-center justify-center border rounded-2xl aspect-[4/3] overflow-hidden">
          <Image
            alt={draft.title}
            src={img}
            width={500}
            height={500}
            onError={(e: React.SyntheticEvent) => {
              const target = e.target as HTMLImageElement;
              target.src = fallbackImage.src;
            }}
            className={classNameObject({
              "w-full h-auto": img !== noImage,
              "w-[40px] h-auto": img === noImage
            })}
          />
        </div>
        <div>
          <div className="text-gray-charcoal dark:text-white text-lg font-semibold">
            {draft.title}
          </div>
          <div className="text-gray-steel dark:text-white-075">{summary}</div>
        </div>
        <div />
        <div className="flex flex-wrap items-center gap-4 px-2 justify-end w-full">
          <Button size="sm" onClick={() => editFn(draft, true)} icon={<UilEditAlt />}>
            {i18next.t("drafts.open-editor")}
          </Button>
          <Button size="sm" appearance="gray" onClick={() => editFn(draft, false)}>
            {i18next.t("drafts.open-classic")}
          </Button>
        </div>
      </div>
    </div>
  );
}
