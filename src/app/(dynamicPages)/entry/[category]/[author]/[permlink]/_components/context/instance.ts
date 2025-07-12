"use client";

import { createContext, MutableRefObject } from "react";
import {Entry} from "@/entities";

interface ContextState {
  showProfileBox: boolean;
  setShowProfileBox: (value: boolean) => void;

  editHistory: boolean;
  setEditHistory: (value: boolean) => void;

  showWordCount: boolean;
  setShowWordCount: (value: boolean) => void;

  loading: boolean;
  setLoading: (value: boolean) => void;

  showIfNsfw: boolean;
  setShowIfNsfw: (value: boolean) => void;

  isRawContent: boolean;
  setIsRawContent: (value: boolean) => void;

  selection: string;
  setSelection: (value: string) => void;

  entry?: Entry;
  liveEntry?: Entry;
  setLiveEntry?: (entry: Entry) => void;

  commentsInputRef?: MutableRefObject<HTMLInputElement | null>;
}

export const DEFAULT_CONTEXT: ContextState = {
  showProfileBox: false,
  setShowProfileBox: () => {},
  editHistory: false,
  setEditHistory: () => {},
  showWordCount: false,
  setShowWordCount: () => {},
  loading: false,
  setLoading: () => {},
  showIfNsfw: false,
  setShowIfNsfw: () => {},
  isRawContent: false,
  setIsRawContent: () => {},
  selection: "",
  setSelection: () => {},
  entry: undefined,
  liveEntry: undefined,
  setLiveEntry: () => {}
};

export const EntryPageContext = createContext<ContextState>(DEFAULT_CONTEXT);
