"use client";

import React from "react";
import defaults from "@/defaults";
import { setProxyBase } from "@ecency/render-helper";
import "./_index.scss";
import { Entry, SearchResult } from "@/entities"; // ⬅️ import SearchResult
import i18next from "i18next";
import { getSimilarEntriesQueryOptions, SIMILAR_ENTRIES_MIN_RENDER } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { SimilarEntryItem } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/similar-entries/similar-entry-item";

setProxyBase(defaults.imageServer);

interface Props {
    entry: Entry;
}

export function SimilarEntries({ entry }: Props) {
    // The SDK query only reads author/permlink/json_metadata.tags — pass a
    // minimal typed projection so the web Entry (JsonMetadata | null) lines
    // up with the SDK's narrower { tags?: string[] } parameter.
    const { data: entriesRaw } = useQuery(
        getSimilarEntriesQueryOptions({
            author: entry.author,
            permlink: entry.permlink,
            json_metadata: { tags: entry.json_metadata?.tags }
        })
    );

    // The query yields the SDK's SearchResult — a narrower, nominally-distinct
    // sibling of @/entities SearchResult (the SDK/web type split is
    // deliberately deferred, not homogenised here). The runtime object carries
    // every field this strip renders, so bridge the two via `unknown`.
    const entries: SearchResult[] = Array.isArray(entriesRaw)
        ? (entriesRaw as unknown as SearchResult[])
        : [];

    // Render whatever survived the merge/dedup (capped at 3 by the SDK).
    // Hidden only below the shared min so the strip isn't all-or-nothing.
    if (entries.length < SIMILAR_ENTRIES_MIN_RENDER) return null;

    return (
        <div className="similar-entries-list">
            <div className="similar-entries-list-header">
                <div className="list-header-text">{i18next.t("similar-entries.title")}</div>
            </div>
            <div className="similar-entries-list-body grid grid-cols-1 sm:grid-cols-3 gap-4">
                {entries.map((en, i) => (
                    <SimilarEntryItem
                        entry={en}
                        i={i}
                        key={`${en.id ?? ""}-${en.author}-${en.permlink}-${i}`}
                    />
                ))}
            </div>
        </div>
    );
}
