"use client";

import { Entry } from "@/entities";
import { renderPostBody, setProxyBase, postBodySummary } from "@ecency/render-helper";
import defaults from "@/defaults.json";
import { useEffect, useState } from "react";

interface Props {
  entry: Entry;
}

setProxyBase(defaults.imageServer);

export function EntryPageStaticBody({ entry }: Props) {
  const [renderedBody, setRenderedBody] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Add a small delay to ensure DOM is stable before rendering
    const timer = setTimeout(() => {
      try {
        const rendered = renderPostBody(entry.body, false);
        setRenderedBody(rendered);
      } catch (error) {
        console.error("Error rendering post body:", error);
        // Fallback to a safer rendered version
        setRenderedBody(`<div class="markdown-fallback">${entry.body.replace(/\n/g, '<br>')}</div>`);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [entry.body]);

  // Server-side fallback: show a simplified version
  if (!isClient || !renderedBody) {
    return (
      <div
        id="post-body"
        className="entry-body markdown-view user-selectable client"
        itemProp="articleBody"
      >
        <div className="loading-content" style={{ minHeight: '200px' }}>
          {/* Show a brief summary or the first part of the raw content as fallback */}
          <div className="text-gray-600 dark:text-gray-400">
            {entry.json_metadata?.description || 
             (typeof postBodySummary === 'function' ? postBodySummary(entry.body, 300) : null) || 
             entry.body.substring(0, 300) + '...'}
          </div>
          {!isClient && (
            <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Loading full content...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id="post-body"
      className="entry-body markdown-view user-selectable client"
      itemProp="articleBody"
      dangerouslySetInnerHTML={{ __html: renderedBody }}
    />
  );
}
