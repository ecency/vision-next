import Image from "next/image";
import Link from "next/link";
import { catchPostImage } from "@ecency/render-helper";
import { Entry } from "@/entities";
import { makeEntryPath } from "@/utils/make-path";
import { dateToFullRelative } from "@/utils/parse-date";

interface Props {
  entry: Entry;
  i: number;
}

/**
 * A single related-post card. Pure server component: the `<a href>` is always
 * present in the initial SSR HTML (no `use client`, no query subscription), so
 * it is a durable internal link crawlers can follow. Visually mirrors
 * SimilarEntryItem but renders the timestamp as a static `<time>` (server-safe)
 * instead of the client-only TimeLabel, and links via makeEntryPath so the href
 * is the canonical bare /@author/permlink form (no redirect hop).
 */
export function EntryRelatedCard({ entry, i }: Props) {
  const postImage = catchPostImage(entry, 600, 500);

  return (
    <Link href={makeEntryPath(entry.category, entry.author, entry.permlink)} className="no-style">
      <div
        className="similar-entries-list-item bg-gray-100 hover:bg-blue-dark-sky-040 dark:bg-gray-900 rounded-2xl overflow-hidden transform transition-transform duration-200 hover:rotate-[1.5deg]"
        style={{ animationDelay: `${i * 0.2}s` }}
      >
        {postImage ? (
          <Image
            src={postImage}
            alt={entry.title}
            width={1000}
            height={1000}
            className="object-cover w-full h-[8rem]"
          />
        ) : (
          <div className="w-full h-[8rem] flex items-center justify-center bg-gray-200 dark:bg-dark-default">
            <Image
              src="/assets/noimage.svg"
              alt={entry.title}
              width={1000}
              height={1000}
              className="w-8 h-8"
            />
          </div>
        )}
        <div className="truncate py-2 px-4">{entry.title}</div>
        <div className="item-footer py-2 px-4">
          <span className="item-footer-author">{entry.author}</span>
          <time className="item-footer-date" dateTime={entry.created}>
            {dateToFullRelative(entry.created)}
          </time>
        </div>
      </div>
    </Link>
  );
}
