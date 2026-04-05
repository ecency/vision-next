import { callWithQuorum } from "@ecency/hive-tx";
import { Entry } from "@/modules/posts/types";

/**
 * When the primary node returns null for a get_post call,
 * verify using quorum consensus across multiple nodes before
 * concluding the post is truly deleted.
 *
 * Uses callWithQuorum which queries random nodes and requires
 * agreement from at least 2 nodes - if 2 nodes agree the post
 * exists, we trust it. If 2 agree it's null, it's really gone.
 * This is stronger than the old "try 2 alternate nodes" approach.
 */
export async function verifyPostOnAlternateNode(
  author: string,
  permlink: string,
  observer: string
): Promise<Entry | null> {
  try {
    const response = await callWithQuorum("bridge.get_post", {
      author,
      permlink,
      observer,
    }, 2);

    if (
      response &&
      typeof response === "object" &&
      (response as Entry).author === author &&
      (response as Entry).permlink === permlink
    ) {
      return response as Entry;
    }
  } catch {
    // Quorum couldn't be reached or all nodes failed
  }

  return null;
}
