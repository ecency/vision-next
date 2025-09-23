"use client";

import { PropsWithChildren, useRef, useState, useEffect } from "react";
import { EntryPageContext } from "./instance";
import { useSearchParams } from "next/navigation";

export function EntryPageContextProvider(props: PropsWithChildren) {
  const commentsInputRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();
  
  // Initialize with false to match SSR behavior and prevent hydration mismatch
  const [showProfileBox, setShowProfileBox] = useState(false);
  const [editHistory, setEditHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showIfNsfw, setShowIfNsfw] = useState(false);
  const [isRawContent, setIsRawContent] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selection, setSelection] = useState("");

  // Update state after hydration to sync with actual URL parameters
  useEffect(() => {
    const rawFromUrl = searchParams.has("raw");
    const historyFromUrl = searchParams.has("history");
    
    setIsRawContent(rawFromUrl);
    setEditHistory(historyFromUrl);
  }, [searchParams]);

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
