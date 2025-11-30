import { create } from "zustand";

interface ChatAdminStore {
  showAdminTools: boolean;
  toggleAdminTools: (value?: boolean) => void;
}

export const useChatAdminStore = create<ChatAdminStore>((set) => ({
  showAdminTools: false,
  toggleAdminTools: (value) =>
    set((state) => ({
      showAdminTools: value ?? !state.showAdminTools
    }))
}));
