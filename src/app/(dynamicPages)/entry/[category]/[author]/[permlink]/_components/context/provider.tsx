"use client";

import { PropsWithChildren, useRef, useState } from "react";
import { EntryPageContext } from "./instance";
import { useSearchParams } from "next/navigation";
import { Entry } from "@/entities";
import { useEntryStream } from "@/api/queries/entry/useEntryStream";

interface Props extends PropsWithChildren {
    entry?: Entry;
}

export function EntryPageContextProvider({ entry, children }: Props) {
    const commentsInputRef = useRef<HTMLInputElement>(null);
    const searchParams = useSearchParams();
    const rawFromUrl = searchParams.get("raw") === "1";

    const [liveEntry, setLiveEntry] = useState<Entry | undefined>(entry);
    const [showProfileBox, setShowProfileBox] = useState(false);
    const [editHistory, setEditHistory] = useState(false);
    const [showWordCount, setShowWordCount] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showIfNsfw, setShowIfNsfw] = useState(false);
    const [isRawContent, setIsRawContent] = useState(rawFromUrl);
    const [selection, setSelection] = useState("");

    // ✅ Use hook directly – safe at top level
    useEntryStream(entry?.author ?? "", entry?.permlink ?? "", (payload) => {
        setLiveEntry((prev) =>
            prev
                ? {
                    ...prev,
                    stats: {
                        ...prev.stats,
                        total_votes: payload.stats.total_votes,
                    },
                    children: payload.children,
                    pending_payout_value: payload.pending_payout_value,
                }
                : prev
        );
    });

    return (
        <EntryPageContext.Provider
            value={{
                showWordCount,
                setShowWordCount,
                showProfileBox,
                setShowProfileBox,
                editHistory,
                setEditHistory,
                loading,
                setLoading,
                showIfNsfw,
                setShowIfNsfw,
                isRawContent,
                setIsRawContent,
                setSelection,
                selection,
                entry,
                liveEntry,
                setLiveEntry,
                commentsInputRef,
            }}
        >
            {children}
        </EntryPageContext.Provider>
    );
}
