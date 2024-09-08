import React from "react";
import "./_index.scss";
import { Account, Entry } from "@/entities";
import { EntryListItem } from "@/features/shared";
import { getPromotedEntriesQuery } from "@/api/queries";
import { EntryListContentNoData } from "@/features/shared/entry-list-content/entry-list-content-no-data";

interface Props {
  loading: boolean;
  entries: Entry[];
  sectionParam: string;
  isPromoted: boolean;
  username: string;
  showEmptyPlaceholder?: boolean;
  account?: Account;
}

export function EntryListContent({
  sectionParam: section,
  entries,
  isPromoted,
  loading,
  username,
  showEmptyPlaceholder = true,
  account
}: Props) {
  let dataToRender = [...entries];
  let promotedEntries: Entry[] = [];
  if (isPromoted) {
    const promotedEntriesResponse = getPromotedEntriesQuery().getData();
    promotedEntries = promotedEntriesResponse ?? [];
  }

  return (
    <>
      {dataToRender.length > 0 ? (
        <>
          {dataToRender.map((e, i) => {
            const l = [];

            if (i % 4 === 0 && i > 0) {
              const ix = i / 4 - 1;

              if (promotedEntries?.[ix]) {
                const p = promotedEntries[ix];
                if (!dataToRender.find((x) => x.author === p.author && x.permlink === p.permlink)) {
                  l.push(
                    <EntryListItem
                      key={`${p.author}-${p.permlink}`}
                      entry={p}
                      promoted={true}
                      order={4}
                    />
                  );
                }
              }
            }

            if (isPromoted) {
              l.push(
                <EntryListItem
                  account={account}
                  key={`${e.author}-${e.permlink}`}
                  entry={e}
                  order={i}
                />
              );
            } else {
              l.push(
                <EntryListItem
                  account={account}
                  key={`${e.author}-${e.permlink}`}
                  entry={e}
                  order={i}
                />
              );
            }
            return [...l];
          })}
        </>
      ) : (
        showEmptyPlaceholder && (
          <EntryListContentNoData username={username} loading={loading} section={section} />
        )
      )}
    </>
  );
}
