import * as R from "remeda";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useRevealedKeysStore = create(
  combine({} as Record<string, Record<string, string>>, (set, getState) => ({
    updateKeys(username: string, keys: Record<string, string>) {
      set(R.mergeDeep(getState(), { [username]: keys }));
    }
  }))
);
