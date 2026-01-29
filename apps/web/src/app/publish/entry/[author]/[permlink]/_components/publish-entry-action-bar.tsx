"use client";

import { usePublishState } from "@/app/publish/_hooks";
import { LoginRequired } from "@/features/shared";
import dynamic from "next/dynamic";

const PublishMetaInfoDialog = dynamic(
  () => import("@/app/publish/_components/publish-meta-info-dialog").then((m) => ({
    default: m.PublishMetaInfoDialog
  })),
  { ssr: false }
);
import { Button, StyledTooltip } from "@/features/ui";
import {
  Dropdown,
  DropdownItemWithIcon,
  DropdownMenu,
  DropdownToggle
} from "@/features/ui/dropdown";
import { makeEntryPath, useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { UilDocumentInfo, UilEllipsisV, UilQuestionCircle } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Entry } from "@/entities";

interface Props {
  entry?: Entry;
  onEdit: () => void;
}

export function PublishEntryActionBar({ onEdit, entry }: Props) {
  const [_, setShowGuide] = useSynchronizedLocalStorage(PREFIX + "_pub_onboarding_passed", true);

  const [showMetaInfo, setShowMetaInfo] = useState(false);

  const params = useParams();

  const author = params?.author ?? "";
  const permlink = params?.permlink ?? "";
  const { tags } = usePublishState();

  const sanitizedAuthor = (author as string).replace("%40", "");
  const category = tags?.[0] ?? entry?.category;
  const entryHref =
    category && sanitizedAuthor && permlink
      ? makeEntryPath(category, sanitizedAuthor, permlink as string)
      : "#";

  return (
    <motion.div
      initial={{ opacity: 0, y: -32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ delay: 0.4 }}
      className="container relative z-[11] justify-between gap-4 px-2 md:px-4 flex items-center max-w-[1024px] py-4 mx-auto publish-action-bar"
    >
      {entryHref !== "#" ? (
        <Link target="_blank" href={entryHref}>
          <Button size="sm" noPadding={true} appearance="link">
            {i18next.t("publish.go-to-post")}
          </Button>
        </Link>
      ) : (
        <Button size="sm" noPadding={true} appearance="link" disabled={true}>
          {i18next.t("publish.go-to-post")}
        </Button>
      )}
      <div className="flex items-center gap-4">
        <LoginRequired>
          <Button onClick={onEdit}>{i18next.t("submit.update")}</Button>
        </LoginRequired>

        <StyledTooltip content={i18next.t("publish.get-help")}>
          <Button
            noPadding={true}
            appearance="gray-link"
            icon={<UilQuestionCircle />}
            onClick={() => setShowGuide(true)}
          />
        </StyledTooltip>
        <Dropdown>
          <DropdownToggle>
            <Button noPadding={true} icon={<UilEllipsisV />} appearance="gray-link" />
          </DropdownToggle>
          <DropdownMenu align="right">
            <DropdownItemWithIcon
              onClick={() => setShowMetaInfo(true)}
              icon={<UilDocumentInfo />}
              label={i18next.t("publish.meta-information")}
            />
          </DropdownMenu>
        </Dropdown>
      </div>

      <PublishMetaInfoDialog show={showMetaInfo} setShow={setShowMetaInfo} />
    </motion.div>
  );
}
