"use client";

import { Entry } from "@/entities";
import { SelectionPopover } from "./selection-popover";
import { EntryPageViewerManager } from "./entry-page-viewer-manager";
import { setupPostEnhancements } from "@ecency/renderer";
import dynamic from "next/dynamic";
import { useContext, useEffect, useState, useRef } from "react";
import TransactionSigner from "@/features/shared/transactions/transaction-signer";
import { EntryPageContext } from "./context";
import { EntryPageEdit } from "./entry-page-edit";
import { makeEntryPath } from "@/utils";

const Tweet = dynamic(() => import("react-tweet").then((m) => m.Tweet), {
  ssr: false,
});

interface Props {
  entry: Entry;
}

export function EntryPageBodyViewer({ entry }: Props) {
  const [signingOperation, setSigningOperation] = useState<string>();
  const { isRawContent, isEdit, editHistory } = useContext(EntryPageContext);
  const abortControllerRef = useRef<AbortController | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Cleanup any pending operations
    const cleanup = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    cleanup();

    if (isRawContent || isEdit || editHistory) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    // Create new abort controller for this effect
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Enhanced DOM stability check
    const isElementStable = (element: HTMLElement): boolean => {
      try {
        // Check if element exists and has a parent
        if (!element || !element.parentNode) {
          return false;
        }
        
        // Check if element is actually in the DOM
        if (!document.contains(element)) {
          return false;
        }
        
        // Check if element's parent is stable
        if (!element.parentNode.parentNode) {
          return false;
        }
        
        // Additional check: ensure the element has the expected properties
        if (!element.id || element.id !== "post-body") {
          return false;
        }
        
        return true;
      } catch (e) {
        return false;
      }
    };

    // Use requestAnimationFrame to defer execution until after React DOM updates
    rafIdRef.current = requestAnimationFrame(() => {
      // Check if operation was aborted
      if (abortController.signal.aborted) {
        return;
      }

      try {
        const el = document.getElementById("post-body");

        // Enhanced stability check
        if (!isElementStable(el)) {
          return;
        }

        // Double-check after a microtask to ensure DOM is truly stable
        Promise.resolve().then(() => {
          // Check abort signal again
          if (abortController.signal.aborted) {
            return;
          }

          // Final stability check
          if (!isElementStable(el)) {
            return;
          }

          try {
            setupPostEnhancements(el, {
              onHiveOperationClick: (op) => {
                // Check if component is still mounted
                if (!abortController.signal.aborted) {
                  setSigningOperation(op);
                }
              },
              TwitterComponent: Tweet,
            });
          } catch (e) {
            // Avoid breaking the page if enhancements fail, e.g. due to missing embeds
            console.error("Failed to setup post enhancements", e);
          }
        });
      } catch (e) {
        console.error("Error in post enhancement setup", e);
      }
    });

    // Return cleanup function
    return cleanup;
  }, [isRawContent, isEdit, editHistory]);

  return (
    <EntryPageViewerManager>
      {!isEdit && (
        <SelectionPopover
          postUrl={makeEntryPath(entry.category, entry.author, entry.permlink)}
        >
          {/* nothing here, SSR will render #post-body */}
        </SelectionPopover>
      )}
      {isEdit && entry.parent_author && <EntryPageEdit entry={entry} />}
      <TransactionSigner
        show={!!signingOperation}
        onHide={() => setSigningOperation(undefined)}
        operation={signingOperation}
      />
    </EntryPageViewerManager>
  );
}
