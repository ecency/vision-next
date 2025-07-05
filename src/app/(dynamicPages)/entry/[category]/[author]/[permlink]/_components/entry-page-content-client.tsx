"use client";

import { Entry } from "@/entities";
import { EntryPageBodyViewer } from "./entry-page-body-viewer";
import { EntryPageDiscussions } from "./entry-page-discussions";
import { EntryPageEditHistory } from "./entry-page-edit-history";
import { useContext } from "react";
import { EntryPageContext } from "./context";
import ClientEntryPageNsfwRevealing from "./client-entry-page-nsfwrevealing";

interface Props {
    entry: Entry;
    rawParam: string;
    isEdit: boolean;
    category: string;
}

export function EntryPageContentClient({ entry, rawParam, isEdit, category }: Props) {
    const { showIfNsfw } = useContext(EntryPageContext);

    return (
        <>
            <ClientEntryPageNsfwRevealing entry={entry} showIfNsfw={showIfNsfw}>
                <EntryPageBodyViewer
                    entry={entry}
                    rawParam={rawParam}
                    isEdit={isEdit}
                    showIfNsfw={showIfNsfw}
                />
            </ClientEntryPageNsfwRevealing>
            <EntryPageDiscussions category={category} entry={entry} />
            <EntryPageEditHistory entry={entry} />
        </>
    );
}
