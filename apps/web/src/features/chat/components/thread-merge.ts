import type { MattermostPost } from "../mattermost-api";

/**
 * Build the ordered list of posts for the thread panel.
 *
 * The thread panel must show the WHOLE conversation (root + every reply), not
 * just whatever happens to be in the channel's loaded window. We therefore
 * merge two sources:
 *  - `serverPosts`: the complete thread fetched from the server by root id.
 *  - `localPosts`: the channel buffer, which may hold fresher copies (websocket
 *    edits) and optimistic/pending sends not yet returned by the server.
 *
 * Server posts seed the map first; local thread posts then override by id so
 * the freshest/optimistic copy wins. Result is de-duplicated and sorted oldest
 * to newest.
 */
export function mergeThreadPosts(
  rootId: string,
  serverPosts: MattermostPost[] | undefined,
  localPosts: MattermostPost[]
): MattermostPost[] {
  const byId = new Map<string, MattermostPost>();

  for (const post of serverPosts ?? []) {
    byId.set(post.id, post);
  }
  for (const post of localPosts) {
    if (post.id === rootId || post.root_id === rootId) {
      byId.set(post.id, post);
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.create_at - b.create_at);
}
