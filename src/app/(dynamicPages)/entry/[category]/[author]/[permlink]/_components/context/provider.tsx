"use client";

import {PropsWithChildren, useEffect, useRef, useState} from "react";
import { EntryPageContext } from "./instance";
import { useSearchParams } from "next/navigation";
import { Entry } from "@/entities";
import { initEntrySSE } from "@/api/queries/entry/entry-sse";

interface Props extends PropsWithChildren {
    entry?: Entry;
}

export function EntryPageContextProvider({ entry, children }: Props) {
    const commentsInputRef = useRef<HTMLInputElement>(null);
    const searchParams = useSearchParams();
    const rawFromUrl = searchParams.get("raw") === "1";

    const [showProfileBox, setShowProfileBox] = useState(false);
    const [editHistory, setEditHistory] = useState(false);
    const [showWordCount, setShowWordCount] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showIfNsfw, setShowIfNsfw] = useState(false);
    const [isRawContent, setIsRawContent] = useState(rawFromUrl);
    const [selection, setSelection] = useState("");

    useEffect(() => {
        if (!entry?.author || !entry?.permlink) return;
        const stop = initEntrySSE(entry.author, entry.permlink);

        return () => {
            stop();
        };
    }, [entry?.author, entry?.permlink]);

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
                commentsInputRef,
            }}
        >
            {children}
        </EntryPageContext.Provider>
    );
}
