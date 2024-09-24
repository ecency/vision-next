"use client";

import React from "react";

import defaults from "@/defaults.json";
import { catchPostImage, setProxyBase } from "@ecency/render-helper";
import "./_index.scss";
import { Entry } from "@/entities";
import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";
import { dateToFullRelative, makeEntryPath } from "@/utils";
import Image from "next/image";
import { getSimilarEntriesQuery } from "@/api/queries/get-similar-entries-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { EntryLink } from "@/features/shared";

setProxyBase(defaults.imageServer);

interface Props {
  entry: Entry;
}

export function SimilarEntries({ entry }: Props) {
  const canUseWebp = useGlobalStore((s) => s.canUseWebp);

  const router = useRouter();
  const { data: entries } = getSimilarEntriesQuery(entry).useClientQuery();

  return entries?.length === 3 ? (
    <div className={`similar-entries-list`}>
      <div className="similar-entries-list-header">
        <div className="list-header-text">{i18next.t("similar-entries.title")}</div>
      </div>
      <div className="similar-entries-list-body grid grid-cols-1 sm:grid-cols-3 gap-4">
        {entries?.map((en, i) => (
          <EntryLink entry={en} key={i}>
            <motion.div
              className="similar-entries-list-item bg-gray-100 hover:bg-blue-dark-sky-040 dark:bg-gray-900 rounded-2xl overflow-hidden"
              whileHover={{
                rotate: 1.5
              }}
              initial={{
                opacity: 0,
                y: -24
              }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.2 } }}
            >
              <Image
                src={
                  (catchPostImage(en.img_url, 600, 500, canUseWebp ? "webp" : "match") ||
                    "/assets/noimage.svg") ??
                  "/assets/fallback.png"
                }
                alt={en.title}
                width={1000}
                height={1000}
                className="object-cover w-full h-[8rem]"
              />
              <div className="truncate py-2 px-4">{en.title}</div>
              <div className="item-footer py-2 px-4">
                <span className="item-footer-author">{en.author}</span>
                <span className="item-footer-date">{dateToFullRelative(en.created_at)}</span>
              </div>
            </motion.div>
          </EntryLink>
        ))}
      </div>
    </div>
  ) : (
    <></>
  );
}
