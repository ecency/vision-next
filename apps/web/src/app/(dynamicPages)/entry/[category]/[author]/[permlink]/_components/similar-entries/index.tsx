"use client";

import React from "react";
import defaults from "@/defaults";
import { setProxyBase } from "@ecency/render-helper";
import "./_index.scss";
import { Entry, SearchResult } from "@/entities"; // ⬅️ import SearchResult
import i18next from "i18next";
import { getSimilarEntriesQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { SimilarEntryItem } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/similar-entries/similar-entry-item";

setProxyBase(defaults.imageServer);

interface Props {
    entry: Entry;
}

export function SimilarEntries({ entry }: Props) {
    const { data: entriesRaw } = useQuery(getSimilarEntriesQueryOptions(entry));

    // ✅ normalize to SearchResult[]
    const entries: SearchResult[] = Array.isArray(entriesRaw)
        ? (entriesRaw as SearchResult[])
        : [];

    if (entries.length !== 3) return null;

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
