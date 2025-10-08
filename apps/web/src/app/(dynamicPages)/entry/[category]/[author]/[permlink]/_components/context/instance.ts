"use client";

import { createContext, MutableRefObject } from "react";

interface ContextState {
  showProfileBox: boolean;
  setShowProfileBox: (value: boolean) => void;

  editHistory: boolean;
  setEditHistory: (value: boolean) => void;

  loading: boolean;
  setLoading: (value: boolean) => void;

  showIfNsfw: boolean;
  setShowIfNsfw: (value: boolean) => void;

  isRawContent: boolean;
  setIsRawContent: (value: boolean) => void;

  isEdit: boolean;
  setIsEdit: (value: boolean) => void;

  selection: string;
  setSelection: (value: string) => void;
  commentsInputRef?: MutableRefObject<HTMLTextAreaElement | null>;
}

export const DEFAULT_CONTEXT: ContextState = {
  showProfileBox: false,
  setShowProfileBox: () => {},
  editHistory: false,
  setEditHistory: () => {},
  loading: false,
  setLoading: () => {},
  showIfNsfw: false,
  setShowIfNsfw: () => {},
  isRawContent: false,
  setIsRawContent: () => {},
  isEdit: false,
  setIsEdit: () => {},
  selection: "",
  setSelection: () => {}
};

export const EntryPageContext = createContext<ContextState>(DEFAULT_CONTEXT);
