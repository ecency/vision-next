import { Entry } from "@/entities";
import { EntryRelatedCard } from "./entry-related-card";
// Reuse the "Read next" strip styling so these blocks match SimilarEntries.
import "./similar-entries/_index.scss";

interface Props {
  title: string;
  entries: Entry[];
}

/**
 * A titled grid of related-post links, server-rendered. Shares the
 * `.similar-entries-list` markup/styles with the "Read next" strip so the
 * on-post related blocks ("More from author", "More in {community/tag}") look
 * consistent. Renders nothing when there is nothing to link.
 */
export function EntryRelatedList({ title, entries }: Props) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="similar-entries-list">
      <div className="similar-entries-list-header">
        <div className="list-header-text">{title}</div>
      </div>
      <div className="similar-entries-list-body grid grid-cols-1 sm:grid-cols-3 gap-4">
        {entries.map((entry, i) => (
          <EntryRelatedCard entry={entry} i={i} key={`${entry.author}-${entry.permlink}`} />
        ))}
      </div>
    </div>
  );
}
