"use client";

import React, { useState } from "react";
import i18next from "i18next";
import { useCreateReply } from "@/api/mutations";
import { createReplyPermlink, makeJsonMetaDataReply } from "@/utils";
import { Comment } from "@/features/shared/comment";
import type { Entry } from "@/entities";
import appPackage from "../../../package.json";

interface Props {
  entry: Entry;
  open: boolean;
  onClose: () => void;
}

/**
 * The reply box of the quick view. The same optimistic reply the post page
 * makes: the mutation answers at once and settles in the background, so the
 * box closes on submit. A broadcast that fails later reopens it with the text
 * kept, which is why the box stays mounted while it is closed.
 */
export function CurationReplyBox({ entry, open, onClose }: Props) {
  const [inProgress, setInProgress] = useState(false);
  const [failedText, setFailedText] = useState<string | null>(null);

  const { mutateAsync: createReply } = useCreateReply(
    entry,
    entry,
    () => {
      setInProgress(false);
      onClose();
    },
    (text) => {
      setFailedText(text);
      setInProgress(false);
    }
  );

  const submit = async (text: string) => {
    const permlink = createReplyPermlink(entry.author);
    const tags = entry.json_metadata?.tags || ["ecency"];
    const jsonMeta = makeJsonMetaDataReply(tags, appPackage.version);
    setFailedText(null);
    setInProgress(true);
    return createReply({ jsonMeta, text, permlink, point: true });
  };

  if (!open && failedText == null) return null;

  return (
    <div className="mt-3" data-curation-reply>
      <Comment
        submitText={i18next.t("g.reply")}
        entry={entry}
        onSubmit={submit}
        onCancel={() => {
          setFailedText(null);
          onClose();
        }}
        cancellable
        autoFocus
        inProgress={inProgress}
        initialText={failedText}
      />
    </div>
  );
}
