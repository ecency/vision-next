"use client";

import React, { useMemo } from "react";
import "./_index.scss";
import { Entry } from "@/entities";
import { PopoverConfirm } from "@/features/ui";
import i18next from "i18next";
import { LoginRequired } from "@/features/shared";
import { Tooltip } from "@ui/tooltip";
import { repeatSvg } from "@ui/svg";
import { useGlobalStore } from "@/core/global-store";
import { useEntryReblog } from "@/api/mutations";
import { useGetReblogsQuery } from "@/api/queries";
import { EcencyEntriesCacheManagement } from "@/core/caches";

interface Props {
  entry: Entry;
}

export function EntryReblogBtn({ entry }: Props) {
  const { data } = EcencyEntriesCacheManagement.getEntryQuery(entry).useClientQuery();
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data: reblogs } = useGetReblogsQuery(activeUser?.username);
  const { mutateAsync: reblog, isPending } = useEntryReblog(entry);

  const reblogged = useMemo(
    () =>
      !!activeUser &&
      reblogs?.find((x) => x.author === data?.author && x.permlink === data.permlink) !== undefined,
    [activeUser, data, reblogs]
  );

  const content = (
    <div
      className={`entry-reblog-btn ${reblogged ? "reblogged" : ""} ${
        isPending ? "in-progress" : ""
      } `}
    >
      <Tooltip
        content={
          reblogged ? i18next.t("entry-reblog.delete-reblog") : i18next.t("entry-reblog.reblog")
        }
      >
        <a className="inner-btn">
          {repeatSvg}
          <span>{data?.reblogs && data.reblogs > 0 ? data.reblogs : ""}</span>
        </a>
      </Tooltip>
    </div>
  );

  if (!activeUser) {
    return <LoginRequired>{content}</LoginRequired>;
  }

  // Delete reblog
  if (reblogged) {
    return (
      <PopoverConfirm
        onConfirm={() => reblog({ isDelete: true })}
        okVariant="danger"
        titleText={i18next.t("entry-reblog.delete-confirm-title")}
        okText={i18next.t("entry-reblog.delete-confirm-ok")}
      >
        {content}
      </PopoverConfirm>
    );
  }

  // Reblog
  return (
    <PopoverConfirm
      onConfirm={() => reblog({ isDelete: false })}
      titleText={i18next.t("entry-reblog.confirm-title", { n: activeUser.username })}
      okText={i18next.t("entry-reblog.confirm-ok")}
    >
      {content}
    </PopoverConfirm>
  );
}
