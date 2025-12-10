import { MessageItem } from "./message-item";
import type { MattermostPost, MattermostUser } from "../mattermost-api";

export type PostItem =
  | {
      type: "message";
      post: MattermostPost;
      index: number;
      isGroupStart: boolean;
    }
  | {
      type: "join-group";
      groupId: string;
      posts: MattermostPost[];
      indices: number[];
    };

interface MessageListProps {
  groupedPosts: PostItem[];
  showUnreadDivider: boolean;
  firstUnreadIndex: number;
  expandedJoinGroups: Set<string>;
  setExpandedJoinGroups: React.Dispatch<React.SetStateAction<Set<string>>>;

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
  toggleReaction: (post: MattermostPost, emojiName: string, closePopover?: boolean) => void;

  // State
  openReactionPostId: string | null;
  setOpenReactionPostId: (postId: string | null | ((current: string | null) => string | null)) => void;
  deletingPostId: string | null;
  reactMutationPending: boolean;
  deleteMutationPending: boolean;
}

export function MessageList({
  groupedPosts,
  showUnreadDivider,
  firstUnreadIndex,
  expandedJoinGroups,
  setExpandedJoinGroups,
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
  toggleReaction,
  openReactionPostId,
  setOpenReactionPostId,
  deletingPostId,
  reactMutationPending,
  deleteMutationPending
}: MessageListProps) {
  return (
    <div className="space-y-2.5">
      {groupedPosts.map((item) => {
        if (item.type === "join-group") {
          const isExpanded = expandedJoinGroups.has(item.groupId);
          const firstUnreadInGroup = item.indices.find((i) => i === firstUnreadIndex);

          return (
            <div key={item.groupId} className="space-y-3">
              {showUnreadDivider && firstUnreadInGroup !== undefined && (
                <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-[--text-muted]">
                  <div className="flex-1 border-t border-[--border-color]" />
                  <span>New</span>
                  <div className="flex-1 border-t border-[--border-color]" />
                </div>
              )}
              <div className="w-full flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedJoinGroups((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.groupId)) {
                        next.delete(item.groupId);
                      } else {
                        next.add(item.groupId);
                      }
                      return next;
                    });
                  }}
                  className="rounded bg-[--surface-color] px-4 py-2 text-sm text-[--text-muted] text-center hover:bg-[--hover-color] transition-colors cursor-pointer"
                >
                  {isExpanded ? (
                    <div className="space-y-1">
                      {item.posts.map((post) => (
                        <div key={post.id}>
                          {renderMessageContent(getDecodedDisplayMessage(post))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>{item.posts.length} people joined</span>
                  )}
                </button>
              </div>
            </div>
          );
        }

        const post = item.post;
        const index = item.index;
        const isGroupStart = item.isGroupStart;

        return (
          <MessageItem
            key={post.id}
            post={post}
            index={index}
            isGroupStart={isGroupStart}
            showUnreadDivider={showUnreadDivider}
            firstUnreadIndex={firstUnreadIndex}
            usersById={usersById}
            channelData={channelData}
            activeUser={activeUser}
            postsById={postsById}
            parentPostById={parentPostById}
            getDisplayName={getDisplayName}
            getUsername={getUsername}
            getDecodedDisplayMessage={getDecodedDisplayMessage}
            renderMessageContent={renderMessageContent}
            normalizeUsername={normalizeUsername}
            startDirectMessage={startDirectMessage}
            openThread={openThread}
            handleReply={handleReply}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            toggleReaction={toggleReaction}
            openReactionPostId={openReactionPostId}
            setOpenReactionPostId={setOpenReactionPostId}
            deletingPostId={deletingPostId}
            reactMutationPending={reactMutationPending}
            deleteMutationPending={deleteMutationPending}
          />
        );
      })}
    </div>
  );
}
