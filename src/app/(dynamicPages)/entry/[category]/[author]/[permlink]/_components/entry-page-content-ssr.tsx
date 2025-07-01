import { Entry } from "@/entities";
import { EntryPageProfileBox } from "./entry-page-profile-box";
import { EntryPageIsCommentHeader } from "./entry-page-is-comment-header";
import { EntryPageMainInfo } from "./entry-page-main-info";
import { EntryPageWarnings } from "./entry-page-warnings";
import { EntryTags } from "./entry-tags";
import { EntryFooterInfo } from "./entry-footer-info";
import { EntryPageSimilarEntries } from "./entry-page-similar-entries";
import { EntryPageStaticBody } from "./entry-page-static-body";
import { EntryFooterControls } from "./entry-footer-controls";
import Link from "next/link";
import { UilMapPinAlt } from "@tooni/iconscout-unicons-react";
import { useEntryLocation } from "@/utils";
import {PollWidget, useEntryPollExtractor} from "@/features/polls";

interface Props {
    entry: Entry;
}

export function EntryPageContentSSR({ entry }: Props) {
    const location = useEntryLocation(entry);
    const postPoll = useEntryPollExtractor(entry);

    return (
        <>
            <EntryPageProfileBox entry={entry} />
            <div className="entry-header">
                <EntryPageWarnings entry={entry} />
                <EntryPageIsCommentHeader entry={entry} />
                <h1 className="entry-title">{entry.title}</h1>
                <EntryPageMainInfo entry={entry} />
            </div>
            {/* SSR static body */}
            <EntryPageStaticBody entry={entry} />
            {postPoll && (
                <div className="pb-6">
                    <PollWidget entry={entry} poll={postPoll} isReadOnly={true} />
                </div>
            )}
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
        </>
    );
}
