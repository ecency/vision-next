import Image from "next/image";
import Link from "next/link";
import { catchPostImage } from "@ecency/render-helper";
import { TimeLabel } from "@/features/shared/time-label";
import React, { useMemo } from "react";
import { SearchResult } from "@/entities";
interface Props {
  entry: SearchResult;
  i: number;
}

export function SimilarEntryItem({ entry, i }: Props) {
  const postImage = useMemo(
    () => catchPostImage(entry.img_url, 600, 500),
    [entry.img_url]
  );

  return (
    <Link href={`/@${entry.author}/${entry.permlink}`} className="no-style">
      {/* Entrance animation is CSS (see _index.scss), staggered per item via
          animation-delay — keeps the card visible in the SSR HTML (and with JS
          disabled) instead of a JS-driven serialized opacity:0. */}
      <div
        className="similar-entries-list-item bg-gray-100 hover:bg-blue-dark-sky-040 dark:bg-gray-900 rounded-2xl overflow-hidden transform transition-transform duration-200 hover:rotate-[1.5deg]"
        style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}
      >
        {postImage && (
          <Image
            src={postImage}
            alt={entry.title}
            width={1000}
            height={1000}
            // 1 col on mobile (100vw), 3 cols at >=sm (~33vw) — so the optimizer
            // serves a card-sized rendition instead of a full-width one.
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover w-full h-[8rem]"
          />
        )}
        {!postImage && (
          <div className="w-full h-[8rem] flex items-center justify-center bg-gray-200 dark:bg-dark-default">
            <Image
              src="/assets/noimage.svg"
              alt={entry.title}
              width={1000}
              height={1000}
              className="size-8"
            />
          </div>
        )}
        <div className="truncate py-2 px-4">{entry.title}</div>
        <div className="item-footer py-2 px-4">
          <span className="item-footer-author">{entry.author}</span>
          <TimeLabel created={entry.created_at} mode="fullRelative" className="item-footer-date" />
        </div>
      </div>
    </Link>
  );
}
