"use client";

import React from "react";
import { Entry } from "@/entities";
import { EntryPageNsfwRevealing } from "./entry-page-nsfw-revealing";

interface Props {
    entry: Entry;
    showIfNsfw: boolean;
    children: React.ReactNode;
}

export default function ClientEntryPageNsfwRevealing({ entry, showIfNsfw, children }: Props) {
    return (
        <EntryPageNsfwRevealing entry={entry} showIfNsfw={showIfNsfw}>
            {children}
        </EntryPageNsfwRevealing>
    )
}
