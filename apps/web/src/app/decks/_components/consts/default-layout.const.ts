import { DeckGridItem, DeckGrids } from "../types";
import * as uuid from "uuid";

// A brand-new deck opens straight into the "add column" picker instead of a
// pre-filled feed. The picker (DeckAddColumn) is itself the guided empty state —
// it lists every column type with a description and, once a user picks one,
// replaces itself in place. Pairing this with the one-time onboarding modal
// (DecksOnboarding) teaches what a deck is without seeding arbitrary content.
export const DEFAULT_COLUMNS: DeckGridItem[] = [
  {
    id: uuid.v4(),
    key: 1,
    type: "ac",
    settings: {}
  }
];

export const DEFAULT_LAYOUT: DeckGrids = {
  decks: [
    {
      key: uuid.v4(),
      title: "Default",
      icon: "⭐️",
      storageType: "local",
      columns: DEFAULT_COLUMNS
    }
  ]
};
