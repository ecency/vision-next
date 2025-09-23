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
  const [isMounted, setIsMounted] = useState(false);
  const { isRawContent, isEdit, editHistory } = useContext(EntryPageContext);

  // Ensure this component is fully mounted and hydrated before proceeding
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only proceed if component is mounted (hydration complete) and not in special modes
    if (!isMounted || isRawContent || isEdit || editHistory) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    const setupEnhancements = () => {
      const el = document.getElementById("post-body");

      // Comprehensive DOM element validation
      if (!el) {
        console.warn("Post body element not found, skipping enhancements");
        return false;
      }

      if (!el.isConnected) {
        console.warn("Post body element is not connected to DOM, skipping enhancements");
        return false;
      }

      if (!el.parentNode) {
        console.warn("Post body element has no parent node, skipping enhancements");
        return false;
      }

      // Additional stability check - ensure element has content
      if (!el.innerHTML.trim()) {
        console.warn("Post body element is empty, skipping enhancements");
        return false;
      }

      try {
        setupPostEnhancements(el, {
          onHiveOperationClick: (op) => {
            setSigningOperation(op);
          },
          TwitterComponent: Tweet,
        });
        return true;
      } catch (e) {
        // Avoid breaking the page if enhancements fail
        console.error("Failed to setup post enhancements", e);
        
        // Log detailed diagnostic information
        if (e instanceof TypeError && e.message.includes("parentNode")) {
          console.error("DOM structure issue detected during enhancement setup:", {
            elementExists: !!el,
            elementConnected: el?.isConnected,
            parentExists: !!el?.parentNode,
            elementHTML: el?.innerHTML?.substring(0, 100) + "...",
            error: e.message
          });
        }
        return false;
      }
    };

    // Use requestAnimationFrame to ensure DOM has fully settled after hydration
    const rafId = requestAnimationFrame(() => {
      // Additional frame delay to ensure React has completed all DOM updates
      const rafId2 = requestAnimationFrame(() => {
        setupEnhancements();
      });
      
      return () => cancelAnimationFrame(rafId2);
    });

    return () => cancelAnimationFrame(rafId);
  }, [isMounted, isRawContent, isEdit, editHistory]);

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
