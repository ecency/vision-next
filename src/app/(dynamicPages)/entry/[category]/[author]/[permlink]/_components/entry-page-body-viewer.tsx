"use client";

import { Entry } from "@/entities";
import { PollWidget, useEntryPollExtractor } from "@/features/polls";
import { EntryPageEdit } from "./entry-page-edit";
import { SelectionPopover } from "./selection-popover";
import { EntryPageViewerManager } from "./entry-page-viewer-manager";
import { setupPostEnhancements } from "@ecency/renderer";
import { Tweet } from "react-tweet";
import {useEffect, useState} from "react";
import TransactionSigner from "@/features/shared/transactions/transaction-signer";

interface Props {
  entry: Entry;
  rawParam: string;
  showIfNsfw: boolean;
  isEdit: boolean;
}

export function EntryPageBodyViewer({ entry, rawParam, showIfNsfw, isEdit }: Props) {

  const [signingOperation, setSigningOperation] = useState<string>();

  const preparedEntryBody = entry.body.replace(/<a id="/g, '<a data-id="');

  useEffect(() => {
    const el = document.getElementById("post-body");
    if (el) {
      setupPostEnhancements(el, {
        onHiveOperationClick: (op) => {
          setSigningOperation(op);
        },
        TwitterComponent: Tweet,
      });
    }
  }, []);

  return (
      <EntryPageViewerManager entry={entry}>
        {!isEdit && (
            <>
              <SelectionPopover postUrl={entry.url}>
                {/* nothing here, SSR will render #post-body */}
              </SelectionPopover>
            </>
        )}
        <EntryPageEdit entry={entry} isEdit={isEdit} />
        <TransactionSigner
            show={!!signingOperation}
            onHide={() => setSigningOperation(undefined)}
            operation={signingOperation}
        />
      </EntryPageViewerManager>
  );
}
