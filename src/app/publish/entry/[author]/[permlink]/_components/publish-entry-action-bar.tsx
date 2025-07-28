import { PublishMetaInfoDialog } from "@/app/publish/_components/publish-meta-info-dialog";
import { LoginRequired } from "@/features/shared";
import { Button, StyledTooltip } from "@/features/ui";
import {
  Dropdown,
  DropdownItemWithIcon,
  DropdownMenu,
  DropdownToggle
} from "@/features/ui/dropdown";
import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import {
  UilDocumentInfo,
  UilEllipsisV,
  UilQuestionCircle,
  UilTrash
} from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

interface Props {
  onEdit: () => void;
}

export function PublishEntryActionBar({ onEdit }: Props) {
  const [_, setShowGuide] = useSynchronizedLocalStorage(PREFIX + "_pub_onboarding_passed", true);

  const [showMetaInfo, setShowMetaInfo] = useState(false);

  const params = useParams();

  const author = params?.author ?? "";
  const permlink = params?.permlink ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: -32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ delay: 0.4 }}
      className="container relative z-[11] justify-between gap-4 px-2 md:px-4 flex items-center max-w-[1024px] py-4 mx-auto publish-action-bar"
    >
      <Link target="_blank" href={`/created/@${(author as string).replace("%40", "")}/${permlink}`}>
        <Button size="sm" noPadding={true} appearance="link">
          {i18next.t("publish.go-to-post")}
        </Button>
      </Link>
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
              label="Meta information"
            />
            <div className="border-b border-[--border-color] h-[1px] w-full" />
            <DropdownItemWithIcon
              className="!text-red"
              icon={<UilTrash />}
              label={i18next.t("publish.clear")}
            />
          </DropdownMenu>
        </Dropdown>
      </div>

      <PublishMetaInfoDialog show={showMetaInfo} setShow={setShowMetaInfo} />
    </motion.div>
  );
}
