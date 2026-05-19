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

// The SDK query returns its own (narrower) SearchResult shape; the SDK/web
// type split is deliberately deferred, so map the boundary explicitly here
// rather than bypass it with an `unknown` double-cast. Also resilient: drops
// any row missing the essentials instead of trusting the shape blindly.
interface SdkSimilarRow {
    id?: number;
    title?: string;
    body?: string;
    category?: string;
    author?: string;
    permlink?: string;
    author_rep?: number | string;
    total_payout?: number;
    img_url?: string;
    created_at?: string;
    children?: number;
    tags?: string[];
    app?: string;
    depth?: number;
}

function toSearchResults(raw: unknown): SearchResult[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter(
            (r): r is SdkSimilarRow =>
                !!r &&
                typeof r === "object" &&
                typeof (r as SdkSimilarRow).author === "string" &&
                typeof (r as SdkSimilarRow).permlink === "string"
        )
        .map((r) => ({
            id: r.id ?? 0,
            title: r.title ?? "",
            title_marked: null,
            category: r.category ?? "",
            author: r.author as string,
            permlink: r.permlink as string,
            author_rep: r.author_rep ?? 0,
            children: r.children ?? 0,
            body: r.body ?? "",
            body_marked: null,
            img_url: r.img_url ?? "",
            created_at: r.created_at ?? "",
            payout: r.total_payout ?? 0,
            total_votes: 0,
            up_votes: 0,
            tags: Array.isArray(r.tags) ? r.tags : [],
            depth: r.depth ?? 0,
            app: r.app ?? ""
        }));
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

    // Adapt the SDK rows to the web SearchResult shape (see toSearchResults).
    const entries = toSearchResults(entriesRaw);

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
