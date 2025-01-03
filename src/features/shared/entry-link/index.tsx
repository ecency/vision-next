import React, { PropsWithChildren } from "react";
import { Entry } from "@/entities";
import Link from "next/link";

const makePath = (category: string, author: string, permlink: string, toReplies: boolean = false) =>
  `/${category}/@${author}/${permlink}${toReplies ? "#replies" : ""}`;

export interface PartialEntry {
  category: string;
  author: string;
  permlink: string;
}

interface Props {
  entry: Entry | PartialEntry;
  target?: string;
  className?: string;
}

export function EntryLink({ children, entry, target, className }: PropsWithChildren<Props>) {
  const path = makePath(entry.category, entry.author, entry.permlink);

  return (
    <Link legacyBehavior={true} href={path} target={target}>
      <a className={className + " no-style"} href={path}>
        {children}
      </a>
    </Link>
  );
}
