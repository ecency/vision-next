"use client";

import { Entry } from "@/entities";
import { SelectionPopover } from "./selection-popover";
import { EntryPageViewerManager } from "./entry-page-viewer-manager";
import { setupPostEnhancements } from "@ecency/renderer";
import dynamic from "next/dynamic";
import { useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    if (isRawContent || isEdit || editHistory) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    // Add a small delay to ensure DOM is fully ready
    const enhancePost = async () => {
      try {
        const el = document.getElementById("post-body");

        // More comprehensive checks for DOM readiness
        if (!el || !el.parentNode || !el.isConnected) {
          console.warn("Post body element not ready for enhancements");
          return;
        }

        // Additional check to ensure the element has content
        if (!el.innerHTML || el.innerHTML.trim() === "") {
          console.warn("Post body element is empty, skipping enhancements");
          return;
        }

        // Validate that required DOM methods are available
        if (typeof el.querySelector !== "function" || typeof el.querySelectorAll !== "function") {
          console.warn("DOM query methods not available, skipping enhancements");
          return;
        }

        // Wrap setupPostEnhancements in additional error boundary
        const safeSetupPostEnhancements = () => {
          try {
            // Create a defensive wrapper to catch any internal null pointer exceptions
            const originalQuerySelector = el.querySelector;
            const originalQuerySelectorAll = el.querySelectorAll;
            
            // Override query methods with null-safe versions
            el.querySelector = function(selector) {
              try {
                const result = originalQuerySelector.call(this, selector);
                return result;
              } catch (e) {
                console.warn(`Query selector failed for: ${selector}`, e);
                return null;
              }
            };

            el.querySelectorAll = function(selector) {
              try {
                const result = originalQuerySelectorAll.call(this, selector);
                return result;
              } catch (e) {
                console.warn(`Query selector all failed for: ${selector}`, e);
                return document.createDocumentFragment().querySelectorAll(selector);
              }
            };

            setupPostEnhancements(el, {
              onHiveOperationClick: (op) => {
                setSigningOperation(op);
              },
              TwitterComponent: Tweet,
            });

            // Restore original methods
            el.querySelector = originalQuerySelector;
            el.querySelectorAll = originalQuerySelectorAll;
          } catch (enhancementError) {
            // Restore original methods in case of error
            el.querySelector = originalQuerySelector;
            el.querySelectorAll = originalQuerySelectorAll;
            throw enhancementError;
          }
        };

        safeSetupPostEnhancements();
      } catch (e) {
        // More detailed error logging to help with debugging
        console.error("Failed to setup post enhancements:", {
          error: e,
          message: e instanceof Error ? e.message : "Unknown error",
          stack: e instanceof Error ? e.stack : undefined,
          entryAuthor: entry?.author,
          entryPermlink: entry?.permlink
        });
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        enhancePost();
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isRawContent, isEdit, editHistory, entry?.author, entry?.permlink]);

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
