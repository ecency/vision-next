"use client";

import { Entry } from "@/entities";
import { EntryFooterInfo } from "./entry-footer-info";
import { EntryPageIsCommentHeader } from "./entry-page-is-comment-header";
import { EntryPageMainInfo } from "./entry-page-main-info";
import { EntryPageProfileBox } from "./entry-page-profile-box";
import { EntryPageSimilarEntries } from "./entry-page-similar-entries";
import { EntryPageWarnings } from "./entry-page-warnings";
import { EntryTags } from "./entry-tags";
import {EntryFooterControls} from "./entry-footer-controls";
import {EntryPageDiscussions} from "./entry-page-discussions";
import {EntryPageBodyViewer} from "./entry-page-body-viewer";
import ClientEntryPageNsfwRevealing from "./client-entry-page-nsfwrevealing";
import { useContext } from "react";
import { EntryPageContext } from "./context";

import Link from "next/link";
import { UilMapPinAlt } from "@tooni/iconscout-unicons-react";
import { useEntryLocation } from "@/utils";

interface Props {
    entry: Entry;
    rawParam: string;
    isEdit: boolean;
    category: string;
}

export function EntryPageContent({ entry, rawParam, isEdit, category }: Props) {
    const location = useEntryLocation(entry);
    const { showIfNsfw } = useContext(EntryPageContext);

    return (
        <>
            <EntryPageProfileBox entry={entry} />
            <div className="entry-header">
                <EntryPageWarnings entry={entry} />
                <EntryPageIsCommentHeader entry={entry} />
                <h1 className="entry-title">{entry.title}</h1>
                <EntryPageMainInfo entry={entry} />
            </div>
            <ClientEntryPageNsfwRevealing entry={entry} showIfNsfw={showIfNsfw}>
                <EntryPageBodyViewer entry={entry} rawParam={rawParam} isEdit={isEdit} />
            </ClientEntryPageNsfwRevealing>
            <div className="entry-footer flex-wrap mb-4 lg:mb-8 border border-[--border-color] p-2 md:p-4 rounded-2xl">
                {location?.coordinates && (
                    <Link
                        href={`https://maps.google.com/?q=${location.coordinates.lat},${location.coordinates.lng}`}
                        target="_external"
                        rel="noopener"
                        className="text-sm mb-2 block"
                    >
                        <UilMapPinAlt className="w-4 h-4 mr-1" />
                        {location.address}
                    </Link>
                )}
                <EntryTags entry={entry} />
                <EntryFooterInfo entry={entry} />
                <EntryFooterControls entry={entry} />
            </div>
            <EntryPageSimilarEntries entry={entry} />
            <EntryPageDiscussions category={category} entry={entry} />
        </>
    );
}
