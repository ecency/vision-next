import { useMemo } from "react";
import { getCommentHistoryQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { Entry } from "@/entities";
import { diff_match_patch } from "diff-match-patch";

const dmp = new diff_match_patch();

interface CommentHistoryListItemDiff {
  title: string;
  titleDiff?: string;
  body: string;
  bodyDiff?: string;
  tags: string;
  tagsDiff?: string;
  timestamp: string;
  v: number;
}

function makeDiff(str1: string, str2: string) {
  const d = dmp.diff_main(str1, str2);
  dmp.diff_cleanupSemantic(d);
  return dmp.diff_prettyHtml(d).replace(/&para;/g, "&nbsp;");
}

export function useHistoryList(entry: Entry) {
  const { data: historyData } = useQuery(
    getCommentHistoryQueryOptions(entry.author, entry.permlink, false)
  );

  return useMemo(() => {
    if (!historyData || !historyData.list) {
      return [];
    }

    const t: CommentHistoryListItemDiff[] = [];

    let h = "";
    for (let l = 0; l < historyData.list.length; l += 1) {
      if (historyData.list[l].body.startsWith("@@")) {
        const p = dmp.patch_fromText(historyData.list[l].body);
        h = dmp.patch_apply(p, h)[0];
        historyData.list[l].body = h;
      } else {
        h = historyData.list[l].body;
      }

      t.push({
        v: historyData.list[l].v,
        title: historyData.list[l].title,
        body: h,
        timestamp: historyData.list[l].timestamp,
        tags: Array.isArray(historyData.list[l].tags)?historyData.list[l].tags.join(", "):""
      });
    }

    for (let l = 0; l < t.length; l += 1) {
      const p = l > 0 ? l - 1 : l;

      t[l].titleDiff = makeDiff(t[p].title, t[l].title);
      t[l].bodyDiff = makeDiff(t[p].body, t[l].body);
      t[l].tagsDiff = makeDiff(t[p].tags, t[l].tags);
    }

    return t;
  }, [historyData]);
}
