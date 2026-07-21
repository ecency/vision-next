"use client";

import React, { useMemo } from "react";
import { Community } from "@/entities";
import { nl2list } from "@/utils";
import { scriptTextOutlineSvg } from "@ui/svg";
import i18next from "i18next";
import { DialogInfo } from "../../_types";

interface Props {
  community: Community;
  toggleInfo: (payload: DialogInfo) => void;
}

export function CommunityCardRules({ community, toggleInfo }: Props) {
  const hasRules = useMemo(() => community.flag_text.trim() !== "", [community]);
  const rules = useMemo(
    () =>
      nl2list(community.flag_text).map((x, i) => (
        <p key={i}>
          {"- "}
          {x}
        </p>
      )),
    [community.flag_text]
  );

  return hasRules ? (
    <div className="community-section">
      <div
        className="section-header [&>svg]:size-3.5 md:[&>svg]:size-4"
        role="button"
        tabIndex={0}
        onClick={() => toggleInfo({ title: i18next.t("community-card.rules"), content: rules })}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleInfo({ title: i18next.t("community-card.rules"), content: rules });
          }
        }}
      >
        {scriptTextOutlineSvg} {i18next.t("community-card.rules")}
      </div>
      <div className="section-content">{rules}</div>
    </div>
  ) : (
    <></>
  );
}
