"use client";

import i18next from "i18next";
import clsx from "clsx";
import {
  UilBell,
  UilBookOpen,
  UilCheck,
  UilCommentAltNotes,
  UilExclamationTriangle,
  UilExternalLinkAlt,
  UilThumbsUp,
  UilTimes,
} from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { CurationRecommendBtn } from "./curation-recommend-btn";

interface Props {
  author: string;
  permlink: string;
  isRoster: boolean;
  isTrial: boolean;
  recommendationsEnabled: boolean;
  /**
   * The device's PRIMARY pointer is coarse. Only used to word the Read control:
   * every other control here is a glyph with a tooltip, and a finger cannot
   * hover a tooltip.
   */
  coarsePointer: boolean;
  /** A mark this desk can clear sits on the post, so the control clears it. */
  marked: boolean;
  voteHidden: boolean;
  voteDimmed: boolean;
  /** Why the vote is dimmed, or the plain vote tooltip when it is not. */
  voteTitle: string;
  /** A recommendation would earn nothing: the viewer's own post, or a closed window. */
  recommendHidden: boolean;
  alreadyRecommended?: boolean;
  href: string;
  className?: string;
  /** Controls only one list has, rendered before the open-in-new-tab control. */
  children?: React.ReactNode;
  onOpen: () => void;
  onVote: () => void;
  onReviewed: () => void;
  onClearMark: () => void;
  onSnooze: () => void;
  onFlag: () => void;
  onNote: () => void;
}

/**
 * The desk's row toolbar: read, vote, the roster marks, recommend and open.
 * Shared by the queue and the recommended list so the two cannot drift in
 * order, wording or who sees what; each list decides what a press does and
 * passes the window facts (locked, own post, already marked) it holds.
 */
export function CurationRowActions({
  author,
  permlink,
  isRoster,
  isTrial,
  recommendationsEnabled,
  coarsePointer,
  marked,
  voteHidden,
  voteDimmed,
  voteTitle,
  recommendHidden,
  alreadyRecommended,
  href,
  className,
  children,
  onOpen,
  onVote,
  onReviewed,
  onClearMark,
  onSnooze,
  onFlag,
  onNote,
}: Props) {
  return (
    <div
      role="toolbar"
      aria-label={i18next.t("curation-desk.row.actions")}
      className={clsx("flex w-full flex-wrap items-center justify-end gap-1", className)}
      // The queue row selects itself on a click; pressing a control is not that.
      onClick={(e) => e.stopPropagation()}
    >
      {/* Reading the post is the job, so it is the first control and it says so
          in words: the drawer used to be reachable only by double clicking the
          row (nothing a phone sends) or by the vote button. */}
      <Button
        size="xs"
        appearance="gray-link"
        className="!rounded-lg"
        aria-label={i18next.t("curation-desk.actions.read-key")}
        title={i18next.t("curation-desk.actions.read-key")}
        onClick={onOpen}
        icon={<UilBookOpen />}
      >
        {/* Worded on the device that needs it. Every other control here is a
            glyph with a tooltip, which a finger cannot hover. */}
        {coarsePointer ? i18next.t("curation-desk.actions.read") : undefined}
      </Button>
      {!voteHidden && (
        <Button
          size="xs"
          appearance="gray-link"
          className={clsx("!rounded-lg", voteDimmed && "opacity-50")}
          aria-label={i18next.t("curation-desk.actions.vote")}
          title={voteTitle}
          onClick={onVote}
          icon={<UilThumbsUp />}
        />
      )}
      {isRoster && (
        <>
          {marked ? (
            <Button
              size="xs"
              appearance="gray-link"
              className="!rounded-lg"
              aria-label={i18next.t("curation-desk.actions.clear-mark")}
              title={i18next.t("curation-desk.actions.clear-mark")}
              onClick={onClearMark}
              icon={<UilTimes />}
            />
          ) : (
            <Button
              size="xs"
              appearance="gray-link"
              className="!rounded-lg"
              aria-label={i18next.t("curation-desk.actions.reviewed")}
              title={i18next.t("curation-desk.actions.reviewed-key")}
              onClick={onReviewed}
              icon={<UilCheck />}
            />
          )}
          <Button
            size="xs"
            appearance="gray-link"
            className="!rounded-lg"
            aria-label={i18next.t("curation-desk.actions.snooze")}
            title={i18next.t("curation-desk.actions.snooze-key")}
            onClick={onSnooze}
            icon={<UilBell />}
          />
          <Button
            size="xs"
            appearance="gray-link"
            className="!rounded-lg"
            aria-label={i18next.t("curation-desk.actions.flag")}
            title={i18next.t("curation-desk.actions.flag-key")}
            onClick={onFlag}
            icon={<UilExclamationTriangle />}
          />
          <Button
            size="xs"
            appearance="gray-link"
            className="!rounded-lg"
            aria-label={i18next.t("curation-desk.actions.note")}
            title={i18next.t(isTrial ? "curation-desk.actions.note-trial" : "curation-desk.actions.note-key")}
            onClick={onNote}
            icon={<UilCommentAltNotes />}
          />
        </>
      )}
      {recommendationsEnabled && !recommendHidden && (
        <CurationRecommendBtn
          author={author}
          permlink={permlink}
          alreadyRecommended={alreadyRecommended}
          compact
        />
      )}
      {children}
      {/* after:!hidden: _base.scss appends its own external-link glyph to
          every a[target="_blank"], and this button already draws one. */}
      <Button
        size="xs"
        appearance="gray-link"
        className="!rounded-lg after:!hidden"
        href={href}
        target="_blank"
        rel="noopener"
        aria-label={i18next.t("curation-desk.actions.open")}
        title={i18next.t("curation-desk.actions.open-key")}
        icon={<UilExternalLinkAlt />}
      />
    </div>
  );
}
