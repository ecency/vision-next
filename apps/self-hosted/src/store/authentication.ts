import type { AuthUser, HiveAuthSession } from "@/features/auth";
import { create, useStore } from "zustand";

interface State {
  user?: AuthUser;
  session?: HiveAuthSession;
  setSession: (s?: HiveAuthSession) => void;
  setUser: (u?: AuthUser) => void;
}

export const authenticationStore = create<State>((set) => ({
  user: undefined,
  session: undefined,
  setUser: (user?: AuthUser) => set({ user }),
  setSession: (session?: HiveAuthSession) => set({ session }),
}));

export function useAuthStore() {
  return useStore(authenticationStore);
}
