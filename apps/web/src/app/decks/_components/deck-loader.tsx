import React from "react";
import { Spinner } from "@ui/spinner";
import i18next from "i18next";

export const DeckLoader = () => {
  return (
    <div className="deck-loader">
      <Spinner className="size-8" />
      <div>{i18next.t("decks.loading")}</div>
    </div>
  );
};
