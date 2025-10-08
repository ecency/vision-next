import React, { PropsWithChildren } from "react";
import { Entry } from "@/entities";
import Link from "next/link";
import { makeEntryPath } from "@/utils/make-path";

export interface PartialEntry {
  category: string;
  author: string;
  permlink?: string;
}

interface Props {
  entry: Entry | PartialEntry;
  target?: string;
  className?: string;
}

export function EntryLink({ children, entry, target, className }: PropsWithChildren<Props>) {
  const path = makeEntryPath(entry.category, entry.author, entry.permlink);

  return (
    <Link legacyBehavior={true} href={path} target={target}>
      <a className={className + " no-style"} href={path}>
        {children}
      </a>
    </Link>
  );
}
