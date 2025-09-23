"use client";

import { Entry } from "@/entities";
import { renderPostBody, setProxyBase } from "@ecency/render-helper";
import defaults from "@/defaults.json";
import { useEffect, useState } from "react";

interface Props {
  entry: Entry;
}
setProxyBase(defaults.imageServer);

export function EntryPageStaticBody({ entry }: Props) {
  const [renderedContent, setRenderedContent] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Ensure renderPostBody is called only on the client side to prevent hydration mismatch
    try {
      const content = renderPostBody(entry.body, false);
      setRenderedContent(content);
    } catch (error) {
      console.warn("Failed to render post body:", error);
      // Fallback to raw body content if renderPostBody fails
      setRenderedContent(entry.body.replace(/\n/g, '<br>'));
    }
    setIsLoaded(true);
  }, [entry.body]);

  // Show a loading state or placeholder during initial render to match SSR
  if (!isLoaded) {
    return (
      <div
        id="post-body"
        className="entry-body markdown-view user-selectable client"
        itemProp="articleBody"
      >
        <div className="opacity-0">Loading...</div>
      </div>
    );
  }

  return (
    <div
      id="post-body"
      className="entry-body markdown-view user-selectable client"
      itemProp="articleBody"
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
