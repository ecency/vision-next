"use client";

import { PropsWithChildren, useRef, useState } from "react";
import { EntryPageContext } from "./instance";
import { useSearchParams } from "next/navigation";

export function EntryPageContextProvider(props: PropsWithChildren) {
  const commentsInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const rawFromUrl = searchParams.get("raw") === "1";
  const [showProfileBox, setShowProfileBox] = useState(false);
  const [editHistory, setEditHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showIfNsfw, setShowIfNsfw] = useState(false);
  const [isRawContent, setIsRawContent] = useState(rawFromUrl);
  const [selection, setSelection] = useState("");

  return (
    <EntryPageContext.Provider
      value={{
        showProfileBox,
        setShowProfileBox,
        editHistory,
        setEditHistory,
        loading,
        setLoading,
        showIfNsfw,
        setShowIfNsfw,
        isRawContent,
        setIsRawContent,
        setSelection,
        selection,
        commentsInputRef
      }}
    >
      {props.children}
    </EntryPageContext.Provider>
  );
}
