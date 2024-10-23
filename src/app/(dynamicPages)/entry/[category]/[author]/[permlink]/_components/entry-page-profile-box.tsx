"use client";

import { useGlobalStore } from "@/core/global-store";
import { Entry } from "@/entities";
import { AuthorInfoCard } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/author-info-card";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { AnimatePresence } from "framer-motion";
import { useContext } from "react";

interface Props {
  entry: Entry;
}

export function EntryPageProfileBox({ entry }: Props): JSX.Element {
  const isMobile = useGlobalStore((s) => s.isMobile);
  const { showProfileBox } = useContext(EntryPageContext);

  return !isMobile ? (
    <div
      id="avatar-fixed-container"
      className="invisible fixed hidden xl:block top-[8rem] translate-x-[calc(-100%-2rem)] max-w-[180px]"
    >
      <AnimatePresence>{showProfileBox && <AuthorInfoCard entry={entry} />}</AnimatePresence>
    </div>
  ) : (
    <></>
  );
}
