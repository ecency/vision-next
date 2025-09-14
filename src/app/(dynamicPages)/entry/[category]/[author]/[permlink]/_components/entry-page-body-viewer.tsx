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
  const { isRawContent, isEdit } = useContext(EntryPageContext);

  useEffect(() => {
    if (isRawContent || isEdit) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    const el = document.getElementById("post-body");

    if (!el || !el.parentNode) {
      return;
    }

    try {
      setupPostEnhancements(el, {
        onHiveOperationClick: (op) => {
          setSigningOperation(op);
        },
        TwitterComponent: Tweet,
      });
    } catch (e) {
      // Avoid breaking the page if enhancements fail, e.g. due to missing embeds
      console.error("Failed to setup post enhancements", e);
    }
  }, [isRawContent, isEdit]);

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
