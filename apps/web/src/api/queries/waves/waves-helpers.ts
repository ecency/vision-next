import { Entry, WaveEntry } from "@/entities";
import { getDiscussionsQuery } from "@/api/queries/get-discussions-query";

type EntryWithPostId = Entry & { post_id: number };

function normalizeContainer(entry: EntryWithPostId, host: string): WaveEntry {
  return {
    ...entry,
    id: entry.id ?? entry.post_id,
    host
  } as WaveEntry;
}

function normalizeParent(entry: EntryWithPostId): Entry {
  return {
    ...entry,
    id: entry.id ?? entry.post_id
  } as Entry;
}

export function normalizeWaveEntryFromApi(
  entry:
    | (Entry & { post_id: number; container?: EntryWithPostId | null; parent?: EntryWithPostId | null })
    | null
    | undefined,
  host: string
): WaveEntry | null {
  if (!entry) {
    return null;
  }

  const containerSource = entry.container ?? entry;
  const container = normalizeContainer(containerSource, host);

  const parent = entry.parent ? normalizeParent(entry.parent) : undefined;

  return {
    ...entry,
    id: entry.id ?? entry.post_id,
    host,
    container,
    parent
  } as WaveEntry;
}

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
