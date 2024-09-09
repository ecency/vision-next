"use client";

import React from "react";

import defaults from "@/defaults.json";
import { catchPostImage, setProxyBase } from "@ecency/render-helper";
import "./_index.scss";
import { Entry } from "@/entities";
import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";
import { dateToFullRelative } from "@/utils";
import { EntryLink } from "@/features/shared";
import Image from "next/image";
import { getSimilarEntriesQuery } from "@/api/queries/get-similar-entries-query";

setProxyBase(defaults.imageServer);

interface Props {
  entry: Entry;
}

export function SimilarEntries({ entry }: Props) {
  const canUseWebp = useGlobalStore((s) => s.canUseWebp);

  const { data: entries } = getSimilarEntriesQuery(entry).useClientQuery();

  return entries?.length === 3 ? (
    <div className={`similar-entries-list`}>
      <div className="similar-entries-list-header">
        <div className="list-header-text">{i18next.t("similar-entries.title")}</div>
      </div>
      <div className="similar-entries-list-body">
        {entries?.map((en, i) => {
          const img =
            catchPostImage(en.img_url, 600, 500, canUseWebp ? "webp" : "match") ||
            "/assets/noimage.svg";
          const imgSize = img == "/assets/noimage.svg" ? "75px" : "auto";
          const dateRelative = dateToFullRelative(en.created_at);

          return (
            <div className="similar-entries-list-item" key={i}>
              <EntryLink entry={{ category: "relevant", author: en.author, permlink: en.permlink }}>
                <>
                  <div className="item-image">
                    <Image
                      src={img ?? "/assets/fallback.png"}
                      alt={en.title}
                      width={1000}
                      height={1000}
                    />
                  </div>
                  <div className="item-title">{en.title}</div>
                  <div className="item-footer">
                    <span className="item-footer-author">{en.author}</span>
                    <span className="item-footer-date">{dateRelative}</span>
                  </div>
                </>
              </EntryLink>
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <></>
  );
}
