import { CommunitySelectorBrowser } from "@/app/submit/_components/community-selector/community-selector-browser";
import { getCommunityCache } from "@/core/caches";
import { UserAvatar } from "@/features/shared";
import { Button } from "@/features/ui";
import { isCommunity } from "@/utils";
import { UilAngleDown } from "@tooni/iconscout-unicons-react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { useMemo, useState } from "react";
import "./_index.scss";
import Link from "next/link";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  tags: string[];
  onSelect: (prev: string | undefined, next: string | null) => void;
}

function extractCommunityName(tags: string[]) {
  const [tag] = tags;

  if (!tag) {
    return undefined;
  }

  if (!isCommunity(tag)) {
    return undefined;
  }

  return tag;
}

export function CommunitySelector({ tags, onSelect }: Props) {
  const { activeUser } = useActiveAccount();

  const { data: community } = getCommunityCache(extractCommunityName(tags)).useClientQuery();

  const [visible, setVisible] = useState(false);

  const isMyBlog = useMemo(() => !community, [community]);

  return (
    <>
      <Button
        appearance="gray-link"
        size="sm"
        id="community-picker"
        iconPlacement="left"
        icon={
          (community || isMyBlog) && (
            <UserAvatar
              username={community ? community.name : activeUser?.username ?? ""}
              size="small"
            />
          )
        }
        onClick={() => setVisible(true)}
      >
        {community && community.title}
        {!community && i18next.t("community-selector.my-blog")}
        <UilAngleDown className="w-4 h-4" />
      </Button>
      <Modal
        onHide={() => setVisible(false)}
        show={visible}
        centered={true}
        className="community-selector-modal"
      >
        <ModalHeader closeButton={true}>{i18next.t("community-selector.choose")}</ModalHeader>

        <ModalBody>
          <div className="text-sm text-gray-600 dark:text-gray-400 pb-4">
            {i18next.t("community-selector.types-hint")}
            <Link className="pl-1" href="https://docs.ecency.com/hive/communities/#types-of-communities" target="_blank">
              Ecency docs
            </Link>
          </div>
          <CommunitySelectorBrowser
            onHide={() => setVisible(!visible)}
            onSelect={(name: string | null) => {
              const prev = extractCommunityName(tags);
              onSelect(prev, name);
              setVisible(false);
            }}
          />
        </ModalBody>
        <ModalFooter className="flex justify-end">
          <Button
            appearance="gray"
            size="sm"
            onClick={() => {
              const prev = extractCommunityName(tags);
              onSelect(prev, null);
              setVisible(false);
            }}
          >
            {i18next.t("submit.clear")}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
