"use client";

import { dehydrate, hydrate, type DehydratedState, type Query, type QueryClient } from "@tanstack/react-query";

/**
 * Cross-load persistence for the handful of queries a reader sees first.
 *
 * The app is server-rendered, so the FIRST paint of a feed never needs this: the
 * rows are in the HTML. What has no answer without it is every paint that is not
 * a fresh server render — a client-side navigation back into a feed, a reload on
 * a slow link, a tab restored hours later — where the query cache starts empty
 * and the reader waits on the network for content they were just looking at.
 *
 * Two rules keep a persisted copy from becoming a stale copy, which on a social
 * feed is worse than a skeleton:
 *
 *  1. Every family declares its own `maxAge`. A feed page older than that is
 *     dropped on restore rather than shown; tag and community lists, which move
 *     in hours not seconds, keep a much longer window.
 *  2. Restored entries carry their ORIGINAL `dataUpdatedAt`, so they are already
 *     stale against the 60s default and `refetchOnMount` (set below for exactly
 *     these families) revalidates them the moment a component mounts. The reader
 *     sees the old rows immediately and the fresh ones as soon as they land.
 *
 * Hydration order is safe in both directions: `hydrate` only overwrites an entry
 * when the incoming `dataUpdatedAt` is newer, so a persisted page can never
 * replace what the server just rendered, and a restore that lands first is
 * replaced by the SSR payload.
 */

/** Bump when the record shape changes; older records are then discarded. */
const SCHEMA_VERSION = 1;
const DB_NAME = "ecency-query-cache";
const STORE_NAME = "state";
const RECORD_PREFIX = "queries:";
const WRITE_DEBOUNCE_MS = 2000;
/**
 * Ceiling on one record. Feed pages are slimmed (bodies blanked) and a page is
 * ~60KB of JSON, so this holds the working set with room to spare while keeping
 * a pathological cache out of the reader's storage quota.
 */
const MAX_RECORD_BYTES = 1_500_000;
/** Most recently updated matching queries to keep, so browsing 40 profiles cannot grow the record without bound. */
const MAX_PERSISTED_QUERIES = 12;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * The build the record was written by. A deploy can change what a cached entry
 * is expected to contain, so records from another build are discarded rather
 * than hydrated into components that no longer read them the same way.
 */
const BUILD_ID = process.env.SENTRY_RELEASE ?? "dev";

export interface PersistFamily {
  id: string;
  /** How old a persisted entry may be and still be worth showing. */
  maxAge: number;
  /** Infinite queries: keep page 1 only. Later pages are scroll state, not first paint. */
  firstPageOnly?: boolean;
  matches: (queryKey: readonly unknown[]) => boolean;
}

/**
 * What we persist. Deliberately short: everything here is read on first paint,
 * and everything not here stays a network read.
 */
export const PERSIST_FAMILIES: PersistFamily[] = [
  {
    // The reader's own feed and any profile section they were last reading.
    id: "account-posts",
    maxAge: 10 * MINUTE,
    firstPageOnly: true,
    matches: (key) => key[0] === "posts" && key[1] === "account-posts"
  },
  {
    // Trending/hot/created/tag feeds.
    id: "posts-ranked",
    maxAge: 10 * MINUTE,
    firstPageOnly: true,
    matches: (key) => key[0] === "posts" && key[1] === "posts-ranked"
  },
  {
    // Sidebar topics. The query already declares a 1h staleTime; tags do not
    // turn over faster than that, so a day-old list is a fine first paint.
    id: "trending-tags",
    maxAge: 12 * HOUR,
    firstPageOnly: true,
    matches: (key) => key[0] === "posts" && key[1] === "trending-tags"
  },
  {
    id: "communities-list",
    maxAge: 12 * HOUR,
    matches: (key) => key[0] === "communities" && key[1] === "list"
  },
  {
    id: "community-single",
    maxAge: 12 * HOUR,
    matches: (key) => key[0] === "community" && key[1] === "single"
  }
];

/** Key prefixes that get `refetchOnMount`, so a restored entry revalidates instead of sitting there. */
const REVALIDATED_PREFIXES: readonly (readonly unknown[])[] = [
  ["posts", "account-posts"],
  ["posts", "posts-ranked"],
  ["posts", "trending-tags"],
  ["communities", "list"],
  ["community", "single"]
];

export function findPersistFamily(queryKey: readonly unknown[]): PersistFamily | undefined {
  return PERSIST_FAMILIES.find((family) => family.matches(queryKey));
}

export function shouldPersistQuery(query: Query, now = Date.now()): boolean {
  const { status, data, dataUpdatedAt } = query.state;
  if (status !== "success" || data === undefined) {
    return false;
  }

  const family = findPersistFamily(query.queryKey);
  if (!family) {
    return false;
  }

  // Nothing gained by writing what a restore would immediately drop.
  return now - dataUpdatedAt < family.maxAge;
}

function isInfiniteData(data: unknown): data is { pages: unknown[]; pageParams: unknown[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as { pages?: unknown }).pages) &&
    Array.isArray((data as { pageParams?: unknown }).pageParams)
  );
}

/**
 * Page 1 only for infinite families, most recent queries only, so the record
 * stays a first-paint cache rather than a copy of the session.
 */
export function trimPersistedState(state: DehydratedState): DehydratedState {
  const queries = state.queries
    .map((entry) => {
      const family = findPersistFamily(entry.queryKey);
      const data = entry.state.data;
      if (!family?.firstPageOnly || !isInfiniteData(data)) {
        return entry;
      }

      return {
        ...entry,
        state: {
          ...entry.state,
          data: { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) }
        }
      };
    })
    .sort((a, b) => (b.state.dataUpdatedAt ?? 0) - (a.state.dataUpdatedAt ?? 0))
    .slice(0, MAX_PERSISTED_QUERIES);

  return { ...state, queries, mutations: [] };
}

export function selectRestorableQueries(
  state: DehydratedState,
  now = Date.now()
): DehydratedState["queries"] {
  return state.queries.filter((entry) => {
    const family = findPersistFamily(entry.queryKey);
    if (!family) {
      return false;
    }
    const updatedAt = entry.state.dataUpdatedAt ?? 0;
    return updatedAt > 0 && now - updatedAt < family.maxAge;
  });
}

interface PersistRecord {
  schema: number;
  build: string;
  user: string | null;
  at: number;
  state: DehydratedState;
}

/** Storage seam: IndexedDB in the browser, an in-memory map in specs. */
export interface PersistStorage {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB rather than localStorage: a feed page is far past what a 5MB
 * synchronous store should hold, and writing it on the main thread would land
 * on the same frames the feed is trying to render.
 */
export function createIdbStorage(): PersistStorage | null {
  if (typeof indexedDB === "undefined") {
    return null;
  }

  let dbPromise: Promise<IDBDatabase> | null = null;

  const open = () => {
    if (!dbPromise) {
      dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE_NAME)) {
            request.result.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("indexeddb blocked"));
      }).catch((error) => {
        // A failed open must not be memoised as a pending promise forever:
        // private mode and blocked storage both land here.
        dbPromise = null;
        throw error;
      });
    }
    return dbPromise;
  };

  const withStore = async <T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T | null> => {
    try {
      const db = await open();
      const store = db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
      return await promisify(run(store));
    } catch {
      return null;
    }
  };

  return {
    read: (key) => withStore<string>("readonly", (store) => store.get(key) as IDBRequest<string>),
    write: async (key, value) => {
      await withStore("readwrite", (store) => store.put(value, key) as IDBRequest<IDBValidKey>);
    },
    remove: async (key) => {
      await withStore("readwrite", (store) => store.delete(key) as IDBRequest<undefined>);
    },
    keys: async () => {
      const keys = await withStore<IDBValidKey[]>(
        "readonly",
        (store) => store.getAllKeys() as IDBRequest<IDBValidKey[]>
      );
      return (keys ?? []).map(String);
    }
  };
}

function recordKey(user: string | null): string {
  // One record per account. A reader who switches accounts never hydrates the
  // other one's feed, and logging out prunes every record (see `pruneOthers`).
  return `${RECORD_PREFIX}${user ?? "anonymous"}`;
}

export async function restoreQueryCache(
  client: QueryClient,
  storage: PersistStorage,
  user: string | null,
  now = Date.now()
): Promise<number> {
  let record: PersistRecord | null = null;

  try {
    const raw = await storage.read(recordKey(user));
    record = raw ? (JSON.parse(raw) as PersistRecord) : null;
  } catch {
    record = null;
  }

  if (!record || record.schema !== SCHEMA_VERSION || record.build !== BUILD_ID) {
    if (record) {
      await storage.remove(recordKey(user));
    }
    return 0;
  }

  const queries = selectRestorableQueries(record.state, now);
  if (queries.length === 0) {
    return 0;
  }

  hydrate(client, { queries, mutations: [] });
  return queries.length;
}

export async function persistQueryCache(
  client: QueryClient,
  storage: PersistStorage,
  user: string | null,
  now = Date.now()
): Promise<boolean> {
  const state = trimPersistedState(
    dehydrate(client, {
      shouldDehydrateQuery: (query) => shouldPersistQuery(query, now),
      shouldDehydrateMutation: () => false
    })
  );

  const key = recordKey(user);

  // Nothing worth writing yet. Deliberately NOT a delete: the cache is empty
  // for the first moments of every page load, and the record being restored
  // right then is the one that would be thrown away.
  if (state.queries.length === 0) {
    return false;
  }

  const record: PersistRecord = { schema: SCHEMA_VERSION, build: BUILD_ID, user, at: now, state };

  let serialised: string;
  try {
    serialised = JSON.stringify(record);
  } catch {
    return false;
  }

  if (serialised.length > MAX_RECORD_BYTES) {
    return false;
  }

  await storage.write(key, serialised);
  return true;
}

async function pruneOtherRecords(storage: PersistStorage, user: string | null): Promise<void> {
  const keep = recordKey(user);
  const keys = await storage.keys();
  await Promise.all(
    keys.filter((key) => key.startsWith(RECORD_PREFIX) && key !== keep).map((key) => storage.remove(key))
  );
}

/**
 * `refetchOnMount` is false app-wide so an SSR-prefetched page does not refetch
 * the moment it hydrates. That default is exactly wrong for a restored entry,
 * which is old by definition, so the persisted families opt back in: fresh
 * (under the 60s staleTime) still means no request, stale means a background
 * one under rows that are already on screen.
 */
export function applyRevalidationDefaults(client: QueryClient): void {
  for (const prefix of REVALIDATED_PREFIXES) {
    client.setQueryDefaults(prefix as unknown[], { refetchOnMount: true });
  }
}

/**
 * Restores the reader's last cache, then keeps it written. Returns a disposer;
 * calling it stops the subscription and flushes what is in hand.
 */
export function startQueryCachePersistence(
  client: QueryClient,
  user: string | null,
  storage: PersistStorage | null = createIdbStorage()
): () => void {
  applyRevalidationDefaults(client);

  if (!storage) {
    return () => {};
  }

  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (disposed) {
      return;
    }
    void persistQueryCache(client, storage, user).catch(() => {});
  };

  const schedule = () => {
    if (disposed || timer) {
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, WRITE_DEBOUNCE_MS);
  };

  void (async () => {
    try {
      await pruneOtherRecords(storage, user);
      await restoreQueryCache(client, storage, user);
    } catch {
      // A cache is an optimisation. A reader whose storage refuses us still
      // gets the page, one network read later.
    }
  })();

  // Only what we would actually write. Without this filter every query in the
  // app — notification polls included — would re-serialise the record every
  // couple of seconds for the whole session.
  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (event?.query && findPersistFamily(event.query.queryKey)) {
      schedule();
    }
  });

  // A reader who closes the tab is exactly the one who benefits next time, and
  // the debounce would otherwise drop their last few seconds of browsing.
  const onHide = () => {
    if (document.visibilityState === "hidden") {
      flush();
    }
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
  }

  return () => {
    flush();
    disposed = true;
    unsubscribe();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    }
  };
}
