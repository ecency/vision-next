import { Client } from "@hiveio/dhive";
import { CONFIG } from "@/modules/core";
import { Entry } from "@/modules/posts/types";

/** Maximum number of alternate nodes to try during verification */
export const MAX_ALTERNATE_NODES = 2;

/**
 * When the primary node returns null for a get_post call,
 * verify against up to 2 alternate nodes before concluding
 * the post is truly deleted. This guards against sync lag
 * where a single node temporarily returns null for valid content.
 *
 * @param primaryNode - Snapshot of CONFIG.hiveClient.currentAddress captured
 *   before the primary request, so failover can't change which node we exclude.
 */
export async function verifyPostOnAlternateNode(
  author: string,
  permlink: string,
  observer: string,
  primaryNode?: string
): Promise<Entry | null> {
  const allNodes = CONFIG.hiveClient.address;

  // If we can't determine the node list, we can't verify
  if (!Array.isArray(allNodes) || allNodes.length < 2) {
    return null;
  }

  // Filter out the node that just returned null
  const alternateNodes = primaryNode
    ? allNodes.filter((node) => node !== primaryNode)
    : allNodes.slice(1);

  const nodesToTry = alternateNodes.slice(0, MAX_ALTERNATE_NODES);

  for (const node of nodesToTry) {
    try {
      const client = new Client(node, { timeout: 10000 });
      const response = await client.call("bridge", "get_post", {
        author,
        permlink,
        observer,
      });

      if (response) {
        return response as Entry;
      }
    } catch {
      // Node failed — try next one
      continue;
    }
  }

  return null;
}
