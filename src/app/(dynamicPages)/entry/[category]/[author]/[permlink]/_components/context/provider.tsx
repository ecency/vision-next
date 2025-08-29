"use client";

import { PropsWithChildren, useRef, useState } from "react";
import { EntryPageContext } from "./instance";
import { useSearchParams } from "next/navigation";

export function EntryPageContextProvider(props: PropsWithChildren) {
  const commentsInputRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();
  const rawFromUrl = searchParams.has("raw");
  const historyFromUrl = searchParams.has("history");
  const [showProfileBox, setShowProfileBox] = useState(false);
  const [editHistory, setEditHistory] = useState(historyFromUrl);
  const [loading, setLoading] = useState(false);
  const [showIfNsfw, setShowIfNsfw] = useState(false);
  const [isRawContent, setIsRawContent] = useState(rawFromUrl);
  const [isEdit, setIsEdit] = useState(false);
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
        isEdit,
        setIsEdit,
        setSelection,
        selection,
        commentsInputRef
      }}
    >
      {props.children}
    </EntryPageContext.Provider>
  );
}
