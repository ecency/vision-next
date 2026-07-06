import React, { useMemo } from "react";
import { PopoverConfirm } from "@ui/popover-confirm";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { Draft } from "@ecency/sdk";
import { getCommunityCache } from "@/core/caches";
import { dateToFormatted, dateToFullRelative } from "@/utils";
import i18next from "i18next";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import { useQuery } from "@tanstack/react-query";
import { useDeleteDraft } from "@/api/mutations";

interface Props {
  item: Draft;
  confirmApply: boolean;
  onApply: () => void;
}

export function PostTemplatesListItem({ item, confirmApply, onApply }: Props) {
  const tag = item.tags_arr?.[0] ?? "";

  const { data: community } = useQuery(getCommunityCache(tag));

  const dateRelative = useMemo(() => dateToFullRelative(item.modified), [item]);
  const dateFormatted = useMemo(() => dateToFormatted(item.modified), [item]);

  const { mutateAsync: deleteDraft } = useDeleteDraft(() => {});

  return (
    <div className="flex flex-col border dark:border-dark-400 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b dark:border-dark-300 px-3 py-2 bg-gray-100 dark:bg-dark-500">
        <div className="flex items-center gap-3">
          {tag && <Badge>{community?.title ?? tag}</Badge>}
          <div className="text-sm text-gray-600" title={dateFormatted}>
            {dateRelative}
          </div>
        </div>
        <PopoverConfirm
          titleText={i18next.t("post-templates.delete-confirm")}
          onConfirm={() => deleteDraft({ id: item._id })}
        >
          <Button
            size="xs"
            appearance="gray-link"
            icon={<UilTrash />}
            title={i18next.t("g.delete")}
          />
        </PopoverConfirm>
      </div>
      <div className="flex items-center justify-between gap-4 px-3 py-2">
        <div>
          <div className="text-gray-charcoal dark:text-white font-semibold">
            {item.meta?.templateName || item.title || i18next.t("post-templates.untitled")}
          </div>
          {item.title && (
            <div className="text-sm text-gray-steel dark:text-white-075">{item.title}</div>
          )}
        </div>
        {confirmApply ? (
          <PopoverConfirm
            titleText={i18next.t("post-templates.apply-confirm")}
            onConfirm={onApply}
          >
            <Button size="sm">{i18next.t("post-templates.apply")}</Button>
          </PopoverConfirm>
        ) : (
          <Button size="sm" onClick={onApply}>
            {i18next.t("post-templates.apply")}
          </Button>
        )}
      </div>
    </div>
  );
}
