"use client";

import React, { useMemo } from "react";
import { informationOutlineSvg } from "@ui/svg";
import i18next from "i18next";
import { Community } from "@/entities";
import { DialogInfo } from "../../_types";
import { PostContentRenderer } from "@/features/shared";

interface Props {
  community: Community;
  toggleInfo: (payload: DialogInfo) => void;
}

export function CommunityCardDescription({ community, toggleInfo }: Props) {
  const description = useMemo(
    () =>
      community.description.trim() !== "" ? (
        <PostContentRenderer className="preview-body" value={community.description} />
      ) : (
        ""
      ),
    [community.description]
  );

  return description ? (
    <div className="community-section">
      <div
        className="section-header"
        onClick={() => {
          toggleInfo({
            title: i18next.t("community-card.description"),
            content: description
          });
        }}
      >
        {informationOutlineSvg} {i18next.t("community-card.description")}
      </div>
      <div className="section-content">{description}</div>
    </div>
  ) : (
    <></>
  );
}
