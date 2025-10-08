"use client";

import React, { useMemo } from "react";
import "./_index.scss";
import { Entry } from "@/entities";
import { PopoverConfirm } from "@/features/ui";
import i18next from "i18next";
import { LoginRequired } from "@/features/shared";
import { Tooltip } from "@ui/tooltip";
import { repeatSvg } from "@ui/svg";
import { useEntryReblog } from "@/api/mutations";
import { useGetReblogsQuery, useClientActiveUser } from "@/api/queries";
import { EcencyEntriesCacheManagement } from "@/core/caches";

interface Props {
  entry: Entry;
}

export function EntryReblogBtn({ entry }: Props) {
  const { data } = EcencyEntriesCacheManagement.getEntryQuery(entry).useClientQuery();
  const activeUser = useClientActiveUser();

    const { data: reblogs } = useGetReblogsQuery(activeUser?.username);
    const { mutateAsync: reblog, isPending } = useEntryReblog(entry);

    const reblogged = useMemo(
        () =>
            !!activeUser &&
            reblogs?.some((x) => x.author === data?.author && x.permlink === data.permlink),
        [activeUser, data, reblogs]
    );

    const content = (
        <div
            className={`entry-reblog-btn ${reblogged ? "reblogged" : ""} ${
                isPending ? "in-progress" : ""
            }`}
        >
            <Tooltip
                content={
                    reblogged
                        ? i18next.t("entry-reblog.delete-reblog")
                        : i18next.t("entry-reblog.reblog")
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

    return (
    <PopoverConfirm
        onConfirm={() => reblog({ isDelete: !!reblogged })}
        okVariant={reblogged ? "danger" : "primary"}
        titleText={
            reblogged
                ? i18next.t("entry-reblog.delete-confirm-title")
                : i18next.t("entry-reblog.confirm-title", { n: activeUser.username })
        }
        okText={
            reblogged
                ? i18next.t("entry-reblog.delete-confirm-ok")
                : i18next.t("entry-reblog.confirm-ok")
        }
    >
      {content}
    </PopoverConfirm>
    );
}
