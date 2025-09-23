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

    // Additional check to ensure element is still connected to the DOM
    if (!el.isConnected) {
      console.warn("Element #post-body is not connected to the DOM, skipping enhancements");
      return;
    }

    try {
      // Final check right before calling setupPostEnhancements to handle race conditions
      if (!el.isConnected || !el.parentNode) {
        console.warn("Element became disconnected before enhancement setup, aborting");
        return;
      }

      setupPostEnhancements(el, {
        onHiveOperationClick: (op) => {
          setSigningOperation(op);
        },
        TwitterComponent: Tweet,
      });
    } catch (e) {
      // Enhanced error handling to detect parentNode race condition
      if (e instanceof TypeError && e.message.includes("parentNode")) {
        console.warn("Element parentNode became null during enhancement setup (React hydration race condition)", e);
      } else {
        // Avoid breaking the page if enhancements fail, e.g. due to missing embeds
        console.error("Failed to setup post enhancements", e);
      }
    }
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
