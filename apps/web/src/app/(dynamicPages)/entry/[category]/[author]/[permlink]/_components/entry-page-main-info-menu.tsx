"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { Entry } from "@/entities";
import i18next from "i18next";
import { EntryDeleteBtn, EntryMenu } from "@/features/shared";
import { useContext, useMemo } from "react";
import { deleteForeverSvg, pencilOutlineSvg } from "@ui/svg";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import * as ls from "@/utils/local-storage";
import { useRouter } from "next/navigation";
import { makeEntryPath } from "@/utils";

interface Props {
  entry: Entry;
}

export function EntryPageMainInfoMenu({ entry }: Props) {
  const { activeUser } = useActiveAccount();

  const router = useRouter();
  const { setLoading } = useContext(EntryPageContext);

  const isComment = useMemo(() => !!entry.parent_author, [entry]);
  const isOwnEntry = useMemo(
    () => activeUser?.username === entry.author,
    [activeUser?.username, entry.author]
  );
  const extraItems = useMemo(
    () => {
      const path = makeEntryPath(entry.category, entry.author, entry.permlink);
      return [
        ...(isOwnEntry && isComment && path !== "#"
          ? [
              {
                label: i18next.t("g.edit"),
                onClick: () => router.push(`${path}/edit`),
                icon: pencilOutlineSvg
              }
            ]
          : []),
      ...(!(entry.children > 0 || entry.net_rshares > 0 || entry.is_paidout) &&
      isOwnEntry &&
      isComment
        ? [
            {
              label: "",
              onClick: () => {},
              icon: (
                <EntryDeleteBtn
                  entry={entry}
                  setDeleteInProgress={(value) => () => setLoading(true)}
                  onSuccess={deleted}
                >
                  <a title={i18next.t("g.delete")} className="edit-btn">
                    {deleteForeverSvg} {i18next.t("g.delete")}
                  </a>
                </EntryDeleteBtn>
              )
            }
          ]
        : [])
      ];
    },
    [entry, isOwnEntry, isComment, router, setLoading]
  );

  const deleted = () => {
    ls.set(`deletedComment`, entry?.post_id);
    router.back();
  };

  return <EntryMenu entry={entry} separatedSharing={true} extraMenuItems={extraItems} />;
}
