import { Button } from "@ui/button";
import { UserAvatar } from "@/features/shared";
import { emojiIconSvg } from "@ui/icons";
import { blogSvg, deleteForeverSvg, dotsHorizontal, linkSvg, mailSvg, pinSvg } from "@ui/svg";
import { clipboard } from "@/utils/clipboard";
import {
  Dropdown,
  DropdownItemWithIcon,
  DropdownMenu,
  DropdownToggle
} from "@ui/dropdown";
import { Popover, PopoverContent } from "@ui/popover";
import { formatRelativeTime, getAvatarUrl } from "../format-utils";
import { getNativeEmojiFromShortcode, decodeMessageEmojis } from "../emoji-utils";
import clsx from "clsx";
import type { MattermostPost, MattermostUser } from "../mattermost-api";

const QUICK_REACTIONS = ["👍", "👎", "❤️", "😂", "🎉", "😮", "😢"] as const;

interface MessageItemProps {
  post: MattermostPost;
  index: number;
  isGroupStart: boolean;
  showUnreadDivider: boolean;
  firstUnreadIndex: number;
  channelId: string;

  // User and channel data
  usersById: Record<string, MattermostUser>;
  channelData?: {
    member?: { user_id: string };
    canModerate?: boolean;
  };
  activeUser?: { username: string };
  postsById: Map<string, MattermostPost>;
  parentPostById: Map<string, MattermostPost>;

  // Callbacks
  getDisplayName: (post: MattermostPost) => string;
  getUsername: (post: MattermostPost) => string | undefined;
  getDecodedDisplayMessage: (post: MattermostPost) => string;
  renderMessageContent: (content: string) => React.ReactNode;
  normalizeUsername: (username?: string | null) => string | undefined;
  startDirectMessage: (username: string) => void;
  openThread: (post: MattermostPost) => void;
  handleReply: (post: MattermostPost) => void;
  handleEdit: (post: MattermostPost) => void;
  handleDelete: (postId: string) => void;
  handlePinToggle: (postId: string, isPinned: boolean) => void;
  toggleReaction: (post: MattermostPost, emojiName: string, closePopover?: boolean) => void;

  // State
  openReactionPostId: string | null;
  setOpenReactionPostId: (postId: string | null | ((current: string | null) => string | null)) => void;
  deletingPostId: string | null;
  reactMutationPending: boolean;
  deleteMutationPending: boolean;
  canPin: boolean;
  pinMutationPending: boolean;
}

function UsernameActions({
  username,
  displayName,
  currentUsername,
  onStartDm
}: {
  username: string;
  displayName: string;
  currentUsername?: string;
  onStartDm: (username: string) => void;
}) {
  const isSelf = currentUsername
    ? username.toLowerCase() === currentUsername.toLowerCase()
    : false;

  return (
    <Dropdown className="inline-block">
      <DropdownToggle>
        <span
          className="cursor-pointer font-semibold hover:text-[--text-color]"
          title={`@${username}`}
        >
          {displayName}
        </span>
      </DropdownToggle>
      <DropdownMenu align="left" size="small">
        <DropdownItemWithIcon icon={blogSvg} label="View blog" href={`/@${username}`} />
        {!isSelf && (
          <DropdownItemWithIcon
            icon={mailSvg}
            label="Start DM"
            onClick={() => onStartDm(username)}
          />
        )}
      </DropdownMenu>
    </Dropdown>
  );
}

export function MessageItem({
  post,
  index,
  isGroupStart,
  showUnreadDivider,
  firstUnreadIndex,
  channelId,
  usersById,
  channelData,
  activeUser,
  postsById,
  parentPostById,
  getDisplayName,
  getUsername,
  getDecodedDisplayMessage,
  renderMessageContent,
  normalizeUsername,
  startDirectMessage,
  openThread,
  handleReply,
  handleEdit,
  handleDelete,
  handlePinToggle,
  toggleReaction,
  openReactionPostId,
  setOpenReactionPostId,
  deletingPostId,
  reactMutationPending,
  deleteMutationPending,
  canPin,
  pinMutationPending
}: MessageItemProps) {
  const handleCopyLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}/chats/${channelId}?post=${post.id}`;
    clipboard(link);
  };

  return (
    <div
      className={clsx("space-y-1.5", !isGroupStart && "-mt-1")}
      data-post-id={post.id}
    >
      {showUnreadDivider && index === firstUnreadIndex && (
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-[--text-muted]">
          <div className="flex-1 border-t border-[--border-color]" />
          <span>New</span>
          <div className="flex-1 border-t border-[--border-color]" />
        </div>
      )}
      <div className="flex gap-2 group relative">
        {post.type === "system_add_to_channel" ? (
          <div className="w-full flex justify-center">
            <div className="rounded bg-[--surface-color] px-4 py-2 text-sm text-[--text-muted] text-center">
              {renderMessageContent(getDecodedDisplayMessage(post))}
            </div>
          </div>
        ) : (
          <>
            {/* Avatar - show only for group start or hide with placeholder */}
            <div className="h-10 w-10 flex-shrink-0">
              {isGroupStart ? (
                (() => {
                  const user = usersById[post.user_id];
                  const displayName = getDisplayName(post);
                  const username = getUsername(post);
                  const avatarUrl = getAvatarUrl(user);

                  if (username) {
                    return (
                      <UserAvatar username={username} size="medium" className="h-10 w-10" />
                    );
                  }

                  if (avatarUrl) {
                    return (
                      <img
                        src={avatarUrl}
                        alt={`${displayName} avatar`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    );
                  }

                  return (
                    <div className="h-10 w-10 rounded-full bg-[--surface-color] text-sm font-semibold text-[--text-muted] flex items-center justify-center">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  );
                })()
              ) : (
                // Invisible placeholder for grouped messages, shows timestamp on hover
                <div className="h-10 w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-[--text-muted]">
                    {new Date(post.create_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 w-full">
              {/* Header with name and timestamp - show only for group start */}
              {isGroupStart && (
                <div className="flex items-center gap-2 text-xs text-[--text-muted]">
                  {(() => {
                    const username = getUsername(post);
                    const displayName = getDisplayName(post);

                    if (username) {
                      return (
                        <UsernameActions
                          username={username}
                          displayName={displayName}
                          currentUsername={activeUser?.username}
                          onStartDm={startDirectMessage}
                        />
                      );
                    }

                    return <span>{displayName}</span>;
                  })()}
                  <span
                    className="text-[--text-muted] cursor-help"
                    title={new Date(post.create_at).toLocaleString()}
                  >
                    {formatRelativeTime(post.create_at)}
                  </span>
                  {post.edit_at > post.create_at && (
                    <span
                      className="text-[11px] text-[--text-muted] cursor-help"
                      title={`Edited ${new Date(post.edit_at).toLocaleString()}`}
                    >
                      • Edited {formatRelativeTime(post.edit_at)}
                    </span>
                  )}
                </div>
              )}
              {post.root_id &&
                (() => {
                  const rootPost = postsById.get(post.root_id!) ?? post;
                  const parentFromPropsId = post.props?.parent_id as string | undefined;
                  const parentPost =
                    parentPostById.get(post.id) ||
                    (parentFromPropsId ? postsById.get(parentFromPropsId) : undefined);
                  const parentMessage = parentPost
                    ? getDecodedDisplayMessage(parentPost)
                    : typeof post.props?.parent_message === "string"
                      ? decodeMessageEmojis(post.props.parent_message)
                      : undefined;
                  const parentUsername = parentPost
                    ? getDisplayName(parentPost)
                    : normalizeUsername(post.props?.parent_username as string | undefined);

                  if (!parentPost && !parentMessage && !parentUsername) return null;

                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openThread(rootPost);
                      }}
                      className="text-left rounded border-l-4 border-l-blue-500 border-y border-r border-dashed border-[--border-color] bg-blue-50/30 dark:bg-blue-900/10 p-2 text-xs text-[--text-muted] hover:border-[--text-muted] hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <span className="text-blue-500">↪</span>
                        Replying to {parentUsername || "conversation"}
                      </div>
                      {parentMessage && (
                        <div className="line-clamp-2 text-[--text-muted]">
                          {renderMessageContent(parentMessage)}
                        </div>
                      )}
                    </button>
                  );
                })()}
              <div
                className="rounded bg-[--surface-color] p-2.5 text-sm break-words space-y-1 [&>*]:m-0"
              >
                {renderMessageContent(getDecodedDisplayMessage(post))}
              </div>
              {(() => {
                const reactions = post.metadata?.reactions ?? [];
                if (!reactions.length) return null;

                const grouped = reactions.reduce<
                  Record<string, { count: number; reacted: boolean }>
                >((acc, reaction) => {
                  const existing = acc[reaction.emoji_name] || {
                    count: 0,
                    reacted: false
                  };
                  return {
                    ...acc,
                    [reaction.emoji_name]: {
                      count: existing.count + 1,
                      reacted:
                        existing.reacted ||
                        (channelData?.member?.user_id
                          ? reaction.user_id === channelData.member.user_id
                          : false)
                    }
                  };
                }, {});

                return (
                  <div className="flex flex-wrap gap-1 -mt-0.5">
                    {Object.entries(grouped).map(([emojiName, info]) => (
                      <button
                        key={`${post.id}-${emojiName}`}
                        type="button"
                        onClick={() => toggleReaction(post, emojiName)}
                        className={clsx(
                          "flex items-center gap-1 rounded-full border px-2 py-1 text-xs",
                          info.reacted
                            ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/40"
                            : "border-[--border-color] bg-[--background-color]"
                        )}
                      >
                        <span>
                          {getNativeEmojiFromShortcode(emojiName) || `:${emojiName}:`}
                        </span>
                        <span className="text-[--text-muted]">{info.count}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </>
        )}
        {post.type !== "system_add_to_channel" && (
          <div className="absolute -right-2 -top-2 flex gap-1 opacity-100 md:opacity-0 transition-opacity duration-150 md:group-hover:opacity-100 pointer-events-auto md:pointer-events-none md:group-hover:pointer-events-auto">
            {(() => {
              const isReactionPickerOpen = openReactionPostId === post.id;

              return (
                <Popover
                  behavior="click"
                  placement="right"
                  customClassName="bg-[--surface-color] border border-[--border-color] rounded-lg shadow-lg"
                  show={isReactionPickerOpen}
                  setShow={(next) => setOpenReactionPostId(next ? post.id : null)}
                  directContent={
                    <Button
                      appearance="gray-link"
                      size="xs"
                      className="!h-7"
                      icon={emojiIconSvg}
                      aria-label="Add reaction"
                      disabled={reactMutationPending}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenReactionPostId((current) =>
                          current === post.id ? null : post.id
                        );
                      }}
                    />
                  }
                >
                  <PopoverContent className="flex max-w-[220px] flex-wrap gap-2 p-3">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={`${post.id}-${emoji}-picker`}
                        type="button"
                        className="rounded-full border border-[--border-color] bg-[--background-color] px-2 py-1 text-lg hover:border-[--text-muted]"
                        onClick={() => toggleReaction(post, emoji, true)}
                        disabled={reactMutationPending}
                      >
                        {emoji}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              );
            })()}
            <Button
              appearance="gray-link"
              size="xs"
              onClick={() => handleReply(post)}
              className="!h-7"
            >
              Reply
            </Button>
            {post.user_id === channelData?.member?.user_id && (
              <Button
                appearance="gray-link"
                size="xs"
                onClick={() => handleEdit(post)}
                className="!h-7"
              >
                Edit
              </Button>
            )}
            <Dropdown>
              <DropdownToggle>
                <Button
                  icon={dotsHorizontal}
                  appearance="gray-link"
                  size="xs"
                  className="h-7 w-7 !p-0"
                  aria-label="Message actions"
                />
              </DropdownToggle>
              <DropdownMenu align="right" size="small">
                <DropdownItemWithIcon
                  icon={mailSvg}
                  label="Open thread"
                  onClick={() => openThread(post)}
                />
                <DropdownItemWithIcon
                  icon={linkSvg}
                  label="Copy link"
                  onClick={handleCopyLink}
                />
                {canPin && (
                  <DropdownItemWithIcon
                    icon={pinSvg}
                    label={post.is_pinned ? "Unpin message" : "Pin message"}
                    onClick={() => handlePinToggle(post.id, post.is_pinned ?? false)}
                    disabled={pinMutationPending}
                  />
                )}
                {channelData?.canModerate && (
                  <DropdownItemWithIcon
                    icon={deleteForeverSvg}
                    label={
                      deleteMutationPending && deletingPostId === post.id ? "Deleting…" : "Delete"
                    }
                    onClick={() => handleDelete(post.id)}
                    disabled={deleteMutationPending}
                  />
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        )}
      </div>
    </div>
  );
}
