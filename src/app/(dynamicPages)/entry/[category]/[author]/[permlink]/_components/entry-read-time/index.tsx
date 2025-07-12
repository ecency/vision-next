"use client";

import React, { useContext, useEffect, useState } from "react";
import { StyledTooltip } from "@ui/tooltip";
import i18next from "i18next";
import Link from "next/link";
import { UserAvatar } from "@/features/shared";
import { useGlobalStore } from "@/core/global-store";
import { EntryPageContext } from "../context";
import { Button } from "@/features/ui";
import { UilInfoCircle } from "@tooni/iconscout-unicons-react";

export interface ActiveVotes {
  rshares: number;
  voter: string;
}

export const ReadTime = (props: any) => {
  const isMobile = useGlobalStore((s) => s.isMobile);

  const { showWordCount } = useContext(EntryPageContext);

  const { entry, toolTip } = props;

  const [readTime, setReadTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [topCurator, setTopCurator] = useState("");

  useEffect(() => {
    calculateExtras();
    getTopCurator();
  }, [entry?.body, entry?.active_votes]);

  const getTopCurator = async () => {
    if (entry.active_votes?.length > 0) {
      const curator =
        entry.active_votes &&
        entry.active_votes.reduce((prev: ActiveVotes, curr: ActiveVotes) => {
          return prev.rshares! > curr.rshares! ? prev : curr;
        });
      setTopCurator(curator.voter);
    }
  };

  const calculateExtras = async () => {
    const entryCount = countWords(entry.body);
    const wordPerMinuite: number = 225;
    setWordCount(entryCount);
    setReadTime(Math.ceil(entryCount / wordPerMinuite));
  };

  const countWords = (entry: string) => {
    const cjkEntry = new RegExp("[\u4E00-\u9FFF]", "g");
    entry = entry.replace(cjkEntry, " {CJK} ");
    const splitEntry: any = entry.trim().split(/\s+/);
    const cjkCount = splitEntry.filter((e: string) => e === "{CJK}");
    const count: any = splitEntry.includes("{CJK}") ? cjkCount.length : splitEntry.length;
    return count;
  };

  return toolTip ? (
    <div className="post-info">
      <StyledTooltip
        content={
          i18next.t("entry.post-word-count") +
          " " +
          wordCount +
          "\n" +
          i18next.t("entry.post-read-time") +
          " " +
          readTime +
          " " +
          i18next.t("entry.post-read-minutes")
        }
      >
        <Button appearance="gray-link" size="sm" noPadding={true} icon={<UilInfoCircle />} />
      </StyledTooltip>
    </div>
  ) : (
    <>
      {!isMobile && showWordCount && (
        <div id="word-count" className="visible hide-xl">
          <p>
            {i18next.t("entry.post-word-count")} {wordCount}
          </p>
          <p>
            {i18next.t("entry.post-read-time")} {readTime} {i18next.t("entry.post-read-minutes")}
          </p>
          {topCurator && (
            <div className="top-curator">
              {i18next.t("entry.post-top-curator")}
              <StyledTooltip content={topCurator}>
                <Link href={`/@${topCurator}`}>
                  <div className="curator">
                    <UserAvatar username={topCurator} size="small" />
                  </div>
                </Link>
              </StyledTooltip>
            </div>
          )}
        </div>
      )}
    </>
  );
};
export default ReadTime;
