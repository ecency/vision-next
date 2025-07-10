"use client";

import { useCreateReply, usePinReply, useUpdateReply } from "@/api/mutations";
import { useClientActiveUser } from "@/api/queries";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { QueryIdentifiers } from "@/core/react-query";
import { Community, Entry } from "@/entities";
import { SortOrder } from "@/enums";
import {
  EntryDeleteBtn,
  EntryPayout,
  EntryVoteBtn,
  EntryVotes,
  ProfileLink,
  ProfilePopover,
  UserAvatar
} from "@/features/shared";
import { MuteBtn } from "@/features/shared/mute-btn";
import {
  createReplyPermlink,
  dateToFormatted,
  dateToFullRelative,
  makeJsonMetaDataReply
} from "@/utils";
import {
  getCommunityContextQueryOptions,
  getCommunityPermissions,
  getCommunityType
} from "@ecency/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/button";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { deleteForeverSvg, dotsHorizontal, pencilOutlineSvg, pinSvg } from "@ui/svg";
import i18next from "i18next";
import { memo, useMemo, useState } from "react";
import appPackage from "../../../../package.json";
import { Tsx } from "../../i18n/helper";
import { Comment } from "../comment";
import { EntryLink } from "../entry-link";
import { DiscussionBots } from "./discussion-bots";
import { DiscussionItemBody } from "./discussion-item-body";
import { DiscussionList } from "./discussion-list";

interface Props {
  entry: Entry;
  root: Entry;
  community: Community | null;
  isRawContent: boolean;
  hideControls: boolean;
  discussionList: Entry[];
  botsList: string[];
  mutedUsers: string[];
  canMute: boolean;
}

export const DiscussionItem = memo(function DiscussionItem({
  hideControls,
  isRawContent,
  entry,
  community,
  discussionList,
  root,
  botsList,
  mutedUsers,
  canMute
}: Props) {
  const activeUser = useClientActiveUser();
  const [reply, setReply] = useState(false);
  const [edit, setEdit] = useState(false);
  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();

  const isCommunityPost = !!community?.name;
  const { data: userContext } = useQuery({
    ...getCommunityContextQueryOptions(activeUser?.username, community?.name ?? undefined),
    enabled: isCommunityPost && !!activeUser?.username,
    select: ({ subscribed, role }) =>
      getCommunityPermissions({
        communityType: getCommunityType(community?.name ?? "", -1),
        subscribed,
        userRole: role
      })
  });

  const canComment = isCommunityPost
      ? userContext?.canComment
      : !!activeUser?.username;

  const readMore = useMemo(() => entry.children > 0 && entry.depth > 5, [entry]);
  const showSubList = useMemo(() => !readMore && entry.children > 0, [entry, readMore]);
  const canEdit = useMemo(() => activeUser?.username === entry.author, [activeUser, entry]);
  const anchorId = useMemo(() => `anchor-@${entry.author}/${entry.permlink}`, [entry]);
  const isPinned = useMemo(
    () => root.json_metadata.pinned_reply === `${entry.author}/${entry.permlink}`,
    [root, entry]
  );
  const selected = useMemo(() => location.hash === `#@${entry.author}/${entry.permlink}`, [entry]);

  const entryIsMuted = useMemo(() => mutedUsers?.includes(entry.author), [entry, mutedUsers]);
  const isTopComment = useMemo(
    () => entry.parent_author === root.author && entry.parent_permlink === root.permlink,
    [entry, root]
  );
  const isComment = !!entry.parent_author;
  const isOwnRoot = useMemo(() => activeUser?.username === root.author, [activeUser, root]);
  const isOwnReply = useMemo(() => activeUser?.username === entry.author, [activeUser, entry]);
  const isHidden = useMemo(
    () => entry.net_rshares < -7000000000 && entry.active_votes.length > 3,
    [entry]
  );
  const isMuted = useMemo(
    () => entry.stats?.gray && entry.net_rshares >= 0 && entry.author_reputation >= 0,
    [entry]
  );
  const isLowReputation = useMemo(
    () => entry.stats?.gray && entry.net_rshares >= 0 && entry.author_reputation < 0,
    [entry]
  );
  const mightContainMutedComments = useMemo(
    () => activeUser && entryIsMuted && !isComment && !isOwnReply,
    [activeUser, entryIsMuted, isComment, isOwnReply]
  );
  const isDeletable = useMemo(
    () =>
      !(entry.is_paidout || entry.net_rshares > 0 || entry.children > 0) &&
      entry.author === activeUser?.username,
    [entry, activeUser]
  );

  const hasAnyAction = useMemo(
    () => canEdit || (isOwnRoot && isTopComment) || isDeletable,
    [canEdit, isOwnRoot, isTopComment, isDeletable]
  );

  const queryClient = useQueryClient();

  const allReplies = queryClient.getQueryData<Entry[]>([
    QueryIdentifiers.FETCH_DISCUSSIONS,
    root.author,
    root.permlink,
    SortOrder.created,
    activeUser?.username
  ]);

  const filtered = useMemo(
    () =>
      (allReplies ?? []).filter(
        (x) => x.parent_author === entry.author && x.parent_permlink === entry.permlink
      ),
    [allReplies, entry]
  );

  const botsData = useMemo(
    () => filtered.filter((e) => botsList.includes(e.author) && e.children === 0),
    [filtered, botsList]
  );

  const { mutateAsync: createReply, isPending: isCreateLoading } = useCreateReply(
    entry,
    root,
    async () => {
      toggleReply();
      return;
    }
  );
  const { mutateAsync: updateReply, isPending: isUpdateReplyLoading } = useUpdateReply(
    entry,
    async () => {
      toggleEdit();
      return;
    }
  );
  const { mutateAsync: pinReply } = usePinReply(entry, root);

  const toggleReply = () => edit || setReply((r) => !r);
  const toggleEdit = () => reply || setEdit((e) => !e);

  const submitReply = async (text: string) => {
    const permlink = createReplyPermlink(entry.author);
    await createReply({
      text,
      jsonMeta: makeJsonMetaDataReply(entry.json_metadata.tags || ["ecency"], appPackage.version),
      permlink,
      point: true
    });
    setReply(false);
  };

  const _updateReply = (text: string) =>
    updateReply({
      text,
      point: true,
      jsonMeta: makeJsonMetaDataReply(entry.json_metadata.tags || ["ecency"], appPackage.version)
    });

  return (
    <div className={`discussion-item depth-${entry.depth} ${selected ? "selected-item" : ""}`}>
      <div className="relative">
        <div className="item-anchor" id={anchorId} />
      </div>
      <div className="item-inner">
        <div className="item-figure">
          <ProfileLink username={entry.author}>
            <UserAvatar username={entry.author} size="medium" />
          </ProfileLink>
        </div>
        <div className="item-content">
          <div className="item-header">
            <div className="flex items-center" id={`${entry.author}-${entry.permlink}`}>
              <ProfilePopover entry={entry} />
            </div>
            <span className="separator circle-separator" />
            <div className="flex items-center">
              <EntryLink entry={entry}>
                <span className="date" title={dateToFormatted(entry.created)}>
                  {dateToFullRelative(entry.created)}
                </span>
              </EntryLink>
              {isPinned && <div className="w-3.5 h-3.5 ml-3 flex">{pinSvg}</div>}
            </div>
          </div>

          {isMuted && (
            <div className="hidden-warning mt-2">
              <span>
                <Tsx k="entry.muted-warning" args={{ community: entry.community_title }}>
                  <span />
                </Tsx>
              </span>
            </div>
          )}
          {isHidden && (
            <div className="hidden-warning mt-2">
              <span>{i18next.t("entry.hidden-warning")}</span>
            </div>
          )}
          {isLowReputation && (
            <div className="hidden-warning mt-2">
              <span>{i18next.t("entry.lowrep-warning")}</span>
            </div>
          )}
          {mightContainMutedComments && (
            <div className="hidden-warning mt-2">
              <span>{i18next.t("entry.comments-hidden")}</span>
            </div>
          )}

          <DiscussionItemBody entry={entry} isRawContent={isRawContent} />

          {!hideControls && (
            <div className="item-controls flex items-center gap-2">
              <EntryVoteBtn entry={entry} isPostSlider={false} />
              <EntryPayout entry={entry} />
              <EntryVotes entry={entry} />
              {canComment && (
                <a className={`reply-btn ${edit ? "disabled" : ""}`} onClick={toggleReply}>
                  {i18next.t("g.reply")}
                </a>
              )}
              {community && canMute && (
                <MuteBtn
                  entry={entry}
                  community={community}
                  onSuccess={(entry) => updateEntryQueryData([entry])}
                />
              )}
              {hasAnyAction && (
                <div className="ml-3 dropdown-container">
                  <Dropdown>
                    <DropdownToggle>
                      <Button icon={dotsHorizontal} appearance="gray-link" />
                    </DropdownToggle>
                    <DropdownMenu>
                      {canEdit && (
                        <DropdownItemWithIcon
                          label={i18next.t("g.edit")}
                          icon={pencilOutlineSvg}
                          onClick={toggleEdit}
                        />
                      )}
                      {isOwnRoot && isTopComment && (
                        <DropdownItemWithIcon
                          label={i18next.t(isPinned ? "g.unpin" : "g.pin")}
                          icon={pinSvg}
                          onClick={() => pinReply({ pin: !isPinned })}
                        />
                      )}
                      {isDeletable && (
                        <DropdownItemWithIcon
                          label={
                            <EntryDeleteBtn parent={root} entry={entry}>
                              <div className="flex items-center [&>svg]:w-3.5 gap-3">
                                {} {i18next.t("g.delete")}
                              </div>
                            </EntryDeleteBtn>
                          }
                          icon={deleteForeverSvg}
                        />
                      )}
                    </DropdownMenu>
                  </Dropdown>
                </div>
              )}
              <DiscussionBots entries={botsData} />
            </div>
          )}

          {readMore && (
            <div className="read-more">
              <EntryLink entry={entry}>{i18next.t("discussion.read-more")}</EntryLink>
            </div>
          )}
        </div>
      </div>

      {reply && (
        <Comment
          entry={entry}
          submitText={i18next.t("g.reply")}
          cancellable
          onSubmit={submitReply}
          onCancel={toggleReply}
          inProgress={isCreateLoading || isUpdateReplyLoading}
          autoFocus
        />
      )}

      {edit && (
        <Comment
          entry={entry}
          isEdit
          submitText={i18next.t("g.update")}
          cancellable
          onSubmit={_updateReply}
          onCancel={toggleEdit}
          inProgress={isCreateLoading || isUpdateReplyLoading}
          autoFocus
        />
      )}

      {showSubList && (
        <DiscussionList
          discussionList={discussionList}
          community={community}
          parent={entry}
          root={root}
          hideControls={hideControls}
          isRawContent={isRawContent}
        />
      )}
    </div>
  );
});
