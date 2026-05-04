import React, { useContext, useState } from "react";
import { DeckGridContext } from "../deck-manager";
import "./_deck-toolbar-manager.scss";
import { addIconSvg, settingsIconSvg } from "../icons";
import { DecksSettings } from "../deck-settings/decks-settings";
import { DeckGrid } from "../types";
import { Button } from "@ui/button";
import i18next from "i18next";

interface Props {
  isExpanded: boolean;
}

export const DeckToolbarManager = ({ isExpanded }: Props) => {
  const { setActiveDeck, decks, activeDeck } = useContext(DeckGridContext);

  const [showDecksSettings, setShowDecksSettings] = useState(false);
  const [editingDeck, setEditingDeck] = useState<DeckGrid | undefined>(undefined);

  return (
    <div className="deck-toolbar-manager">
      <div className="title">
        <div className="text">{i18next.t("decks.decks")}</div>
        <Button
          appearance="link"
          className="add-deck-btn"
          onClick={() => setShowDecksSettings(true)}
          icon={addIconSvg}
          aria-label={i18next.t("decks.add-deck", { defaultValue: "Add deck" })}
        />
      </div>
      <div className="deck-list">
        {decks.decks.map((deck) => (
          <div
            key={deck.key}
            className={"deck-list-item " + (deck.key === activeDeck ? "selected" : "")}
            role="button"
            tabIndex={0}
            aria-pressed={deck.key === activeDeck}
            onClick={() => setActiveDeck(deck.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveDeck(deck.key);
              }
            }}
          >
            <div className="icon">{deck.icon ? deck.icon : deck.title[0]}</div>
            {isExpanded ? (
              <div className="title px-0">
                {deck.title}
                {deck.storageType === "local" ? (
                  <div className="local">{i18next.t("decks.local")}</div>
                ) : (
                  <></>
                )}
              </div>
            ) : (
              <></>
            )}
            {isExpanded ? (
              <Button
                appearance="link"
                onClick={(e: { stopPropagation: () => void }) => {
                  e.stopPropagation();
                  setEditingDeck(deck);
                  setShowDecksSettings(true);
                }}
                icon={settingsIconSvg}
                aria-label={i18next.t("decks.edit-deck", { defaultValue: "Edit deck" })}
              />
            ) : (
              <></>
            )}
          </div>
        ))}
      </div>
      <DecksSettings deck={editingDeck} show={showDecksSettings} setShow={setShowDecksSettings} />
    </div>
  );
};
