import React, { memo, useMemo } from "react";
import { informationOutlineSvg } from "@ui/svg";
import i18next from "i18next";
import { Community } from "@/entities";
import { DialogInfo } from "../../_types";
import { EcencyRenderer } from "@ecency/renderer";

const MemoRenderer = memo(EcencyRenderer);

interface Props {
  community: Community;
  toggleInfo: (payload: DialogInfo) => void;
}

export function CommunityCardDescription({ community, toggleInfo }: Props) {
  const description = useMemo(
    () =>
      community.description.trim() !== "" ? (
        <MemoRenderer className="preview-body" value={community.description} />
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
