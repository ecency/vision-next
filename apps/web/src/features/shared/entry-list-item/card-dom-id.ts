import { Entry } from "@/entities";

/**
 * The DOM id of a feed card: the post it shows, and nothing else.
 *
 * `author` and `permlink` together are unique on chain, but joining them with a
 * dash is not: a dash is legal inside BOTH (`good-karma` is a real account), so
 * `alice-bob` + `post` and `alice` + `bob-post` would both spell
 * `alice-bob-post`. The separator has to be one the parts cannot contain, and
 * encoding gets there without assuming anything about the charset — for every
 * real Hive name it is a no-op, and anything unexpected is escaped rather than
 * left to collide.
 *
 * ⚠ The result is NOT a valid CSS selector (`/` needs escaping there). Look one
 * up with `document.getElementById(...)`, never `querySelector("#" + id)`.
 */
export function cardDomId(entry: Pick<Entry, "author" | "permlink">): string {
  return `${encodeURIComponent(entry.author)}/${encodeURIComponent(entry.permlink)}`;
}
