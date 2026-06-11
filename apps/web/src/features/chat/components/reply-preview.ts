import type { MattermostPost } from "../mattermost-api";
import { decodeMessageEmojis } from "../emoji-utils";

export interface ReplyPreview {
  parentUsername?: string;
  parentMessage?: string;
}

/**
 * Resolve the "replying to" preview (author + excerpt) shown above a threaded
 * message.
 *
 * Correctness rules — a reply must reference the message it actually replied
 * to, never itself:
 *  - Prefer the explicit reply target `props.parent_id` over the chronological
 *    "previous message in the thread" heuristic (`parentPostById`).
 *  - Never resolve the parent to the message itself (guards against bad data
 *    where `parent_id === post.id`).
 *  - When the parent post isn't loaded, fall back to the `parent_message` /
 *    `parent_username` props captured at send time — never to the root post or
 *    the message's own text (the previous behaviour, which made a reply quote
 *    itself whenever the root post was outside the loaded window).
 */
export function resolveReplyPreview(
  post: MattermostPost,
  postsById: Map<string, MattermostPost>,
  parentPostById: Map<string, MattermostPost>,
  helpers: {
    getDecodedDisplayMessage: (post: MattermostPost) => string;
    getDisplayName: (post: MattermostPost) => string;
    normalizeUsername: (username?: string | null) => string | undefined;
  }
): ReplyPreview {
  const parentFromPropsId = post.props?.parent_id as string | undefined;
  const candidate =
    (parentFromPropsId ? postsById.get(parentFromPropsId) : undefined) ||
    parentPostById.get(post.id);
  const parentPost = candidate && candidate.id !== post.id ? candidate : undefined;

  const parentMessage = parentPost
    ? helpers.getDecodedDisplayMessage(parentPost)
    : typeof post.props?.parent_message === "string"
      ? decodeMessageEmojis(post.props.parent_message)
      : undefined;

  const parentUsername = parentPost
    ? helpers.getDisplayName(parentPost)
    : helpers.normalizeUsername(post.props?.parent_username as string | undefined);

  return { parentUsername, parentMessage };
}
