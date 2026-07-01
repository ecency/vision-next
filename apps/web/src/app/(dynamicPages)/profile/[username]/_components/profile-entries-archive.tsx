import { Entry, FullAccount } from "@/entities";
import { EntryListContent } from "@/features/shared";
import { EntryArchivePager } from "@/features/shared/entry-archive-pager";
import { ProfileEntriesLayout } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-layout";
import { stripActiveVotesFromValue } from "@/core/react-query/strip-active-votes";
import { ARCHIVE_MAX_PAGE } from "@/app/(dynamicPages)/profile/[username]/_helpers/author-archive";

interface Props {
  section: string;
  account: FullAccount;
  entries: Entry[];
  page: number;
  hasNext: boolean;
  currentUser?: string;
}

/**
 * A numbered archive page for an author's section feed: a fully server-rendered
 * list (no infinite scroll) plus a crawlable prev/next pager. Used for
 * /@author/<section>/page/N so a crawler can walk the author's history beyond
 * the sitemap's recent window.
 */
export function ProfileEntriesArchive({
  section,
  account,
  entries,
  page,
  hasNext,
  currentUser
}: Props) {
  const stripped = stripActiveVotesFromValue(entries, currentUser);
  return (
    <ProfileEntriesLayout section={section} username={account.name}>
      <EntryListContent
        account={account}
        username={`@${account.name}`}
        loading={false}
        entries={stripped}
        sectionParam={section}
        isPromoted={false}
        showEmptyPlaceholder={false}
      />
      <EntryArchivePager
        basePath={`/@${account.name}/${section}`}
        page={page}
        hasNext={hasNext}
        maxPage={ARCHIVE_MAX_PAGE}
      />
    </ProfileEntriesLayout>
  );
}
