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
import { getReblogsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  entry: Entry;
}

export function EntryReblogBtn({ entry }: Props) {
  const { data } = useQuery(EcencyEntriesCacheManagement.getEntryQuery(entry));
  const { activeUser } = useActiveAccount();

    const { data: reblogs } = useQuery(getReblogsQueryOptions(activeUser?.username, activeUser?.username));
    const { mutateAsync: reblog, isPending } = useEntryReblog(entry);

    const reblogged = useMemo(
        () =>
            !!activeUser &&
            reblogs?.some((x) => x.author === data?.author && x.permlink === data.permlink),
        [activeUser, data, reblogs]
    );

    const reblogLabel = reblogged
        ? i18next.t("entry-reblog.delete-reblog")
        : i18next.t("entry-reblog.reblog");

    const content = (
        <div
            className={`entry-reblog-btn ${reblogged ? "reblogged" : ""} ${
                isPending ? "in-progress" : ""
            }`}
            role="button"
            tabIndex={0}
            aria-label={reblogLabel}
            aria-pressed={reblogged}
            aria-disabled={isPending}
            onKeyDown={(e) => {
                // While a reblog is in flight the SCSS sets pointer-events:none to
                // block a double-submit via mouse; mirror that for the keyboard
                // path (which pointer-events can't reach) so Enter/Space can't
                // reopen the confirm popover and fire a second request.
                if (isPending) return;
                if (e.key === "Enter" || e.key === " ") {
                    // Activation lives on the click handler injected by the
                    // wrapping LoginRequired / PopoverConfirm, so bridge the
                    // keyboard event to it. Makes the control reachable and
                    // operable without a mouse (matches EntryVoteBtn/EntryTipBtn).
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).click();
                }
            }}
        >
            <Tooltip content={reblogLabel}>
                <a className="inner-btn" aria-hidden={true}>
                    {repeatSvg}
                    <span>{data?.reblogs && data.reblogs > 0 ? data.reblogs : ""}</span>
                </a>
            </Tooltip>
        </div>
    );

    if (!activeUser) {
        return <LoginRequired promptOnAnon>{content}</LoginRequired>;
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
