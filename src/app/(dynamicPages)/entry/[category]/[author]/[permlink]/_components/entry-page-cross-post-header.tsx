"use client";

import { Entry } from "@/entities";
import { ProfileLink, UserAvatar } from "@/features/shared";
import { TagLink } from "@/features/shared/tag";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import { makeEntryPath } from "@/utils";
import { crossPostMessage } from "@/utils/cross-post";
import i18next from "i18next";
import Link from "next/link";
import { useState } from "react";
import { EntryPageCrossPostBody } from "./entry-page-cross-post-body";

interface Props {
  entry: Entry;
}

export function EntryPageCrossPostHeader({ entry }: Props) {
  const [showOriginalEntry, setShowOriginalEntry] = useState(false);

  return entry.original_entry ? (
    <>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-t-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          {i18next.t("entry.cross-post-by")}
          <ProfileLink username={entry.author}>
            <div className="flex items-center gap-1">
              <UserAvatar username={entry.author} size="small" />
              {`@${entry.author}`}
            </div>
          </ProfileLink>
        </div>
        <div className="flex items-center md:justify-end gap-2">
          <TagLink tag={entry.category} type="link">
            <div className="community-link">{entry.community_title}</div>
          </TagLink>
          {i18next.t("entry.cross-post-community")}
        </div>
        <div
          className="text-blue-dark-sky hover:text-blue-dark-sky-hover cursor-pointer md:col-span-2"
          onClick={() => setShowOriginalEntry(true)}
        >
          {'"'}
          {crossPostMessage(entry.body)}
          {'"'}
        </div>
      </div>

      <Modal
        size="lg"
        centered={true}
        show={showOriginalEntry}
        onHide={() => setShowOriginalEntry(false)}
      >
        <ModalHeader closeButton={true}>{entry.original_entry.title}</ModalHeader>
        <ModalBody>
          <EntryPageCrossPostBody entry={entry} />
        </ModalBody>
        <ModalFooter className="flex justify-end">
          <Link
            target="_external"
            href={makeEntryPath(
              entry.original_entry.category,
              entry.original_entry.author,
              entry.original_entry.permlink
            )}
          >
            <Button size="sm">{i18next.t("decks.columns.view-full-post")}</Button>
          </Link>
        </ModalFooter>
      </Modal>
    </>
  ) : (
    <></>
  );
}
