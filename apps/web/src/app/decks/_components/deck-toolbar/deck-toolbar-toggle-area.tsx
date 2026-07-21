import React from "react";
import { arrowLeftSvg, arrowRightSvg } from "@ui/svg";
import i18next from "i18next";

interface Props {
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
}

export const DeckToolbarToggleArea = ({ isExpanded, setIsExpanded }: Props) => {
  return (
    <div
      className="deck-toolbar-toggle [&>svg]:size-6"
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={i18next.t("g.toggle", { defaultValue: "Toggle" })}
      onClick={() => setIsExpanded(!isExpanded)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }
      }}
    >
      {isExpanded ? arrowLeftSvg : arrowRightSvg}
    </div>
  );
};
