"use client";

import { useQuery } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { QueryIdentifiers } from "@/core/react-query";
import i18next from "i18next";
import Link from "next/link";
import type { ReactElement } from "react";
import { authorSendApi, type SentIssue } from "./author-send-api";
import { useNewsletterEnabled } from "./runtime";

/**
 * The sender's own history (vision-web#1532): the list's last issues, digest or
 * author-sent, with what became of them. Sender-only, like the standing notice:
 * asked for only when the viewer is the sender, and rendered from nothing else.
 */
export const sentIssuesKey = (
  type: "creator" | "community",
  target: string,
  viewer: string | null | undefined
): readonly [QueryIdentifiers, string, string, string] => [QueryIdentifiers.NEWSLETTER_SENT_ISSUES, type, target, viewer ?? "anon"] as const;

/**
 * When the issue went out. `period_start` is when the covered week or month
 * BEGAN, not when the digest was sent, so a weekly row reads a full week older
 * than the send: on Mon 2026-09-07 the newest @ecency row said 8/24, for an
 * issue that left on 8/31. Under a heading that says "Sent digests" that reads
 * as an oldest-first list rather than a recent one.
 *
 * `created_at` is the send: the tick opens the issue and starts sending it in
 * the same pass (six seconds apart across the issues measured), and it is the
 * only send-side timestamp the summary payload carries. The period is not lost,
 * it moves to the title.
 *
 * Returns null rather than an Invalid Date so the caller can fall back instead
 * of rendering "Invalid Date" for a payload without a usable timestamp.
 */
export function sentIssueSentAt(issue: Pick<SentIssue, "created_at">): Date | null {
  if (!issue.created_at) return null;
  const at = new Date(issue.created_at);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** The period label, kept as a plain UTC date: `period_start` is a date, not an instant. */
export function periodStartLabel(periodStart: string, locale = i18next.language): string {
  const at = new Date(`${periodStart}T00:00:00Z`);
  return Number.isNaN(at.getTime()) ? periodStart : at.toLocaleDateString(locale, { timeZone: "UTC" });
}

export function SentIssues({
  type,
  target,
  isSender,
  limit = 3,
  className
}: {
  type: "creator" | "community";
  target: string;
  isSender: boolean;
  limit?: number;
  className?: string;
}): ReactElement | null {
  const enabled = useNewsletterEnabled();
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const { data, isError } = useQuery({
    queryKey: sentIssuesKey(type, target, username),
    enabled: enabled && isSender && !!username,
    staleTime: 60_000,
    queryFn: () => authorSendApi.issues(type, target, username!)
  });
  if (!isSender) return null;
  // A failed load is said, quietly: it is not the same as "nothing sent yet".
  if (isError) return <div className={`text-xs opacity-60 ${className ?? ""}`}>{i18next.t("newsletter.sent-issues-unavailable")}</div>;
  if (!data || data.length === 0) return null;
  const items = data.slice(0, limit);
  return (
    <div className={`text-sm ${className ?? ""}`}>
      <div className="font-semibold mb-1" id="newsletter-sent-issues-heading">
        {i18next.t("newsletter.sent-issues")}
      </div>
      <ul className="m-0 p-0 list-none flex flex-col gap-1" aria-labelledby="newsletter-sent-issues-heading">
        {items.map((i: SentIssue) => {
          const sentAt = sentIssueSentAt(i);
          const period = periodStartLabel(i.period_start);
          return (
            <li key={i.id} className="flex flex-wrap items-baseline gap-x-2 opacity-90">
              <time
                dateTime={sentAt ? sentAt.toISOString() : i.period_start}
                title={i18next.t("newsletter.sent-issue-period", { date: period })}
                className="text-xs opacity-70 tabular-nums"
              >
                {sentAt ? sentAt.toLocaleDateString(i18next.language) : period}
              </time>
              {i.post_author && i.post_permlink ? (
                <Link href={`/@${i.post_author}/${i.post_permlink}`} className="truncate max-w-[16rem]">
                  {i.subject}
                </Link>
              ) : (
                <span className="truncate max-w-[16rem]">{i.subject}</span>
              )}
              <span className="text-xs opacity-70">
                {i18next.t("newsletter.sent-issue-stats", { delivered: i.delivered, bounced: i.bounced })}
                {i.rejected > 0 ? ` · ${i18next.t("newsletter.sent-issue-rejected", { rejected: i.rejected })}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
