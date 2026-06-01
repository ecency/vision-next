import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { catchPostImage } from "@ecency/render-helper";
import { TimeLabel } from "@/features/shared/time-label";
import React, { useMemo, useRef } from "react";
import { SearchResult } from "@/entities";
interface Props {
  entry: SearchResult;
  i: number;
}

export function SimilarEntryItem({ entry, i }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const postImage = useMemo(
    () => catchPostImage(entry.img_url, 600, 500),
    [entry.img_url]
  );

  return (
    <Link href={`/@${entry.author}/${entry.permlink}`} className="no-style">
      <motion.div
        ref={ref}
        className="similar-entries-list-item bg-gray-100 hover:bg-blue-dark-sky-040 dark:bg-gray-900 rounded-2xl overflow-hidden transform transition-transform duration-200 hover:rotate-[1.5deg]"
        initial={{
          opacity: 0,
          y: -24
        }}
        animate={{ opacity: 1, y: 0, transition: { delay: i * 0.2 } }}
        onAnimationComplete={() => ref.current?.style.removeProperty("transform")}
      >
        {postImage && (
          <Image
            src={postImage}
            alt={entry.title}
            width={1000}
            height={1000}
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
              className="w-8 h-8"
            />
          </div>
        )}
        <div className="truncate py-2 px-4">{entry.title}</div>
        <div className="item-footer py-2 px-4">
          <span className="item-footer-author">{entry.author}</span>
          <TimeLabel created={entry.created_at} mode="fullRelative" className="item-footer-date" />
        </div>
      </motion.div>
    </Link>
  );
}
