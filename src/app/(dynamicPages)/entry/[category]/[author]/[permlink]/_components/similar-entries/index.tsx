"use client";

import React from "react";

import defaults from "@/defaults.json";
import { setProxyBase } from "@ecency/render-helper";
import "./_index.scss";
import { Entry } from "@/entities";
import i18next from "i18next";
import { getSimilarEntriesQuery } from "@/api/queries/get-similar-entries-query";
import { SimilarEntryItem } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/similar-entries/similar-entry-item";

setProxyBase(defaults.imageServer);

interface Props {
  entry: Entry;
}

export function SimilarEntries({ entry }: Props) {
  const { data: entries } = getSimilarEntriesQuery(entry).useClientQuery();

  return entries?.length === 3 ? (
    <div className={`similar-entries-list`}>
      <div className="similar-entries-list-header">
        <div className="list-header-text">{i18next.t("similar-entries.title")}</div>
      </div>
      <div className="similar-entries-list-body grid grid-cols-1 sm:grid-cols-3 gap-4">
        {entries?.map((en, i) => <SimilarEntryItem entry={en} i={i} key={i} />)}
      </div>
    </div>
  ) : (
    <></>
  );
}
