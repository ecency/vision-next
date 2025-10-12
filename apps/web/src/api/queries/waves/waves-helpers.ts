import { Entry, WaveEntry } from "@/entities";
import { getDiscussionsQuery } from "@/api/queries/get-discussions-query";

export function toEntryArray(x: unknown): Entry[] {
  return Array.isArray(x) ? (x as Entry[]) : [];
}

export async function getVisibleFirstLevelThreadItems(
  container: WaveEntry
): Promise<Entry[]> {
  const discussionItemsRaw = await getDiscussionsQuery(container).fetchAndGet();
  const discussionItems = toEntryArray(discussionItemsRaw);

  if (discussionItems.length <= 1) {
    return [];
  }

  const firstLevelItems = discussionItems.filter(
    ({ parent_author, parent_permlink }) =>
      parent_author === container.author && parent_permlink === container.permlink
  );

  if (firstLevelItems.length === 0) {
    return [];
  }

  const visibleItems = firstLevelItems.filter((item) => !item.stats?.gray);

  return visibleItems;
}

export function mapThreadItemsToWaveEntries(
  items: Entry[],
  container: WaveEntry,
  host: string
): WaveEntry[] {
  if (items.length === 0) {
    return [];
  }

  return items
    .map((item) => {
      const parent = items.find(
        (i) =>
          i.author === item.parent_author &&
          i.permlink === item.parent_permlink &&
          i.author !== host
      );

      return {
        ...item,
        id: item.post_id,
        host,
        container,
        parent
      } as WaveEntry;
    })
    .filter((entry) => entry.container.post_id !== entry.post_id)
    .sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
    );
}
