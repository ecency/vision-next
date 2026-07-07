export interface PublishTargetInput {
  /** User-entered tags from the editor. */
  tags: string[];
  /** True when the instance is a community instance with a community id. */
  isCommunityMode: boolean;
  /** The community id (hive-NNNNN) for community instances. */
  communityId: string;
}

export interface PublishTarget {
  /** Category the post is published under (the comment parent permlink). */
  parentPermlink: string;
  /** Tags to store in json metadata (community tag first in community mode). */
  tags: string[];
}

/**
 * Resolve where a post is published and how its tags are ordered.
 *
 * Blog mode: the first user tag is the category and the tags are kept as-is.
 * Community mode: the community id is the category and it is placed first in
 * the json metadata tags, matching what Hive communities expect. The logged-in
 * user stays the author; the post is simply published into the community.
 */
export function resolvePublishTarget({
  tags,
  isCommunityMode,
  communityId,
}: PublishTargetInput): PublishTarget {
  if (isCommunityMode && communityId) {
    const community = communityId.toLowerCase().trim();
    const rest = tags.filter((tag) => tag.toLowerCase().trim() !== community);
    return {
      parentPermlink: community,
      tags: [community, ...rest],
    };
  }

  return {
    parentPermlink: (tags[0] ?? "").toLowerCase().trim(),
    tags,
  };
}
