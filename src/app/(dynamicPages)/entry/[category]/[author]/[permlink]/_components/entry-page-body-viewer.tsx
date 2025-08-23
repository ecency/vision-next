"use client";

import { Entry } from "@/entities";
import { SelectionPopover } from "./selection-popover";
import { EntryPageViewerManager } from "./entry-page-viewer-manager";
import { setupPostEnhancements } from "@ecency/renderer";
import { Tweet } from "react-tweet";
import { useContext, useEffect, useState } from "react";
import TransactionSigner from "@/features/shared/transactions/transaction-signer";
import { EntryPageContext } from "./context";
import { EntryPageEdit } from "./entry-page-edit";

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
    const el = document.getElementById("post-body");
    if (el) {
      setupPostEnhancements(el, {
        onHiveOperationClick: (op) => {
          setSigningOperation(op);
        },
        TwitterComponent: Tweet,
      });
    }
  }, [isRawContent, isEdit]);

  return (
    <EntryPageViewerManager>
      {!isEdit && (
        <SelectionPopover postUrl={entry.url}>
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
