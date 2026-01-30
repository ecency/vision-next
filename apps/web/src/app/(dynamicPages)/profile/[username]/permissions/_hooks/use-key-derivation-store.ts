import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KeyDerivationMethod = "bip44" | "master-password" | "unknown";

interface KeyDerivationState {
  // Map: username -> publicKey -> derivation method
  derivations: Record<string, Record<string, KeyDerivationMethod>>;
  setDerivation: (username: string, publicKey: string, method: KeyDerivationMethod) => void;
  setMultipleDerivations: (username: string, keys: Record<string, KeyDerivationMethod>) => void;
  getDerivation: (username: string, publicKey: string) => KeyDerivationMethod;
}

export const useKeyDerivationStore = create<KeyDerivationState>()(
  persist(
    (set, get) => ({
      derivations: {},

      setDerivation: (username, publicKey, method) => {
        set((state) => ({
          derivations: {
            ...state.derivations,
            [username]: {
              ...state.derivations[username],
              [publicKey]: method
            }
          }
        }));
      },

      setMultipleDerivations: (username, keys) => {
        set((state) => ({
          derivations: {
            ...state.derivations,
            [username]: {
              ...state.derivations[username],
              ...keys
            }
          }
        }));
      },

      getDerivation: (username, publicKey) => {
        return get().derivations[username]?.[publicKey] ?? "unknown";
      }
    }),
    {
      name: "ecency-key-derivations"
    }
  )
);
