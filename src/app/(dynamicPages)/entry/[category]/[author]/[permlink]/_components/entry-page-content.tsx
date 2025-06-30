//import { EntryFooterControls } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-footer-controls";
//import { EntryPageDiscussions } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-discussions";
import { EntryFooterInfo } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-footer-info";
import { EntryPageBodyViewer } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-body-viewer";
import { EntryPageIsCommentHeader } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-is-comment-header";
import { EntryPageMainInfo } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-main-info";
import { EntryPageNsfwRevealing } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-nsfw-revealing";
import { EntryPageProfileBox } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-profile-box";
import { EntryPageSimilarEntries } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-similar-entries";
import { EntryPageWarnings } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-warnings";
import { EntryTags } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-tags";
import { Entry } from "@/entities";

import ClientEntryFooterControls from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/client-entry-footer-controls";
import ClientEntryPageDiscussions from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/client-entry-page-discussions";
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

  return (
    <EntryPageNsfwRevealing entry={entry}>
      <EntryPageProfileBox entry={entry} />
      <div className="entry-header">
        <EntryPageWarnings entry={entry} />
        <EntryPageIsCommentHeader entry={entry} />
        <h1 className="entry-title">{entry.title}</h1>
        <EntryPageMainInfo entry={entry} />
      </div>
      <EntryPageBodyViewer entry={entry} rawParam={rawParam} isEdit={isEdit} />
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
        <ClientEntryFooterControls entry={entry} />
      </div>
      <EntryPageSimilarEntries entry={entry} />
      <ClientEntryPageDiscussions category={category} entry={entry} />
    </EntryPageNsfwRevealing>
  );
}
