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

    const el = document.getElementById("post-body");

    if (!el || !el.parentNode) {
      return;
    }

    // Create a safe wrapper for setupPostEnhancements to handle race conditions
    const setupEnhancementsSafely = () => {
      try {
        // Double-check element still exists and has parent before proceeding
        if (!el || !el.isConnected || !el.parentNode) {
          console.warn("Post body element is no longer available, skipping enhancements");
          return;
        }

        // Use a MutationObserver to detect if the element gets removed during processing
        let isElementRemoved = false;
        const observer = new MutationObserver(() => {
          if (!el.isConnected) {
            isElementRemoved = true;
            observer.disconnect();
          }
        });

        // Start observing the parent for child removals
        if (el.parentNode) {
          observer.observe(el.parentNode, { childList: true, subtree: true });
        }

        // Create a wrapper that checks element validity before DOM operations
        const originalQuerySelector = document.querySelector.bind(document);
        const originalGetElementById = document.getElementById.bind(document);
        
        // Override methods to add safety checks during enhancement
        const safeQuerySelector = (selector: string) => {
          if (isElementRemoved) return null;
          const result = originalQuerySelector(selector);
          return result && result.isConnected ? result : null;
        };
        
        const safeGetElementById = (id: string) => {
          if (isElementRemoved) return null;
          const result = originalGetElementById(id);
          return result && result.isConnected ? result : null;
        };

        // Temporarily override document methods during enhancement
        Object.defineProperty(document, 'querySelector', {
          value: safeQuerySelector,
          configurable: true
        });
        Object.defineProperty(document, 'getElementById', {
          value: safeGetElementById,
          configurable: true
        });

        setupPostEnhancements(el, {
          onHiveOperationClick: (op) => {
            setSigningOperation(op);
          },
          TwitterComponent: Tweet,
        });

        // Restore original methods
        Object.defineProperty(document, 'querySelector', {
          value: originalQuerySelector,
          configurable: true
        });
        Object.defineProperty(document, 'getElementById', {
          value: originalGetElementById,
          configurable: true
        });

        observer.disconnect();
      } catch (e) {
        // Avoid breaking the page if enhancements fail, e.g. due to missing embeds or race conditions
        console.error("Failed to setup post enhancements", e);
      }
    };

    // Use requestAnimationFrame to ensure DOM is stable before processing
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(setupEnhancementsSafely);
    }, 50); // Small delay to let React finish any pending updates

    return () => {
      clearTimeout(timeoutId);
    };
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
