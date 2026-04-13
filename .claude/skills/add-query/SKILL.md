---
name: add-query
description: Add a new query to @ecency/sdk or the web app with React Query integration
argument-hint: [query-name]
disable-model-invocation: true
---

# Add Query

Create a new data query with React Query integration.

## Decide Where It Lives

| Data type | Package | Location |
|---|---|---|
| Hive blockchain data (posts, accounts, communities) | `@ecency/sdk` | `packages/sdk/src/modules/<domain>/queries/` |
| Wallet/asset data (balances, tokens, SPK) | `@ecency/wallets` | `packages/wallets/src/modules/` |
| App-specific data (polls, threespeak, market) | `@ecency/web` | `apps/web/src/api/queries/` |

## Step 1: Define Query Keys

Location: `packages/sdk/src/modules/core/query-keys.ts`

```typescript
static <domain> = {
  _prefix: ["<domain>"] as const,
  all: () => [...QueryKeys.<domain>._prefix, "all"] as const,
  byId: (id: string) => [...QueryKeys.<domain>._prefix, "byId", id] as const,
  list: (params: Record<string, unknown>) => [...QueryKeys.<domain>._prefix, "list", params] as const,
};
```

## Step 2: Create Query Options Builder

Location: `packages/sdk/src/modules/<domain>/queries/get-<entity>-query-options.ts`

The SDK uses **query option builders** (not hooks) so they work in both React and non-React contexts:

```typescript
import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core/query-keys";
import { CONFIG } from "@/modules/core/config-manager";

export function get<Entity>QueryOptions(param?: string) {
  // Guard against undefined params
  if (!param) {
    return queryOptions({
      queryKey: QueryKeys.<domain>.byId(""),
      queryFn: () => null,
      enabled: false,
    });
  }

  return queryOptions({
    queryKey: QueryKeys.<domain>.byId(param),
    queryFn: async () => {
      const result = await CONFIG.hiveClient.call("bridge", "<api_method>", { param });
      return result;
    },
    enabled: !!param,
  });
}
```

**For infinite queries** (paginated lists):

```typescript
import { infiniteQueryOptions } from "@tanstack/react-query";

export function get<Entity>InfiniteQueryOptions(params: Params) {
  return infiniteQueryOptions({
    queryKey: QueryKeys.<domain>.list(params),
    queryFn: async ({ pageParam }) => {
      return CONFIG.hiveClient.call("bridge", "<method>", {
        ...params,
        start_author: pageParam?.author,
        start_permlink: pageParam?.permlink,
      });
    },
    initialPageParam: undefined as PageParam | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      const last = lastPage[lastPage.length - 1];
      return { author: last.author, permlink: last.permlink };
    },
  });
}
```

## Step 3: Export from Module

```typescript
// packages/sdk/src/modules/<domain>/index.ts
export * from "./queries/get-<entity>-query-options";
```

## Step 4: Use in Web App

```typescript
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { get<Entity>QueryOptions } from "@ecency/sdk";

// In a component
function MyComponent({ id }: { id: string }) {
  const { data, isLoading } = useQuery(get<Entity>QueryOptions(id));
  // ...
}

// For prefetching (SSR or route loading)
await queryClient.prefetchQuery(get<Entity>QueryOptions(id));
```

## Step 5: Build and Test

```bash
pnpm --filter @ecency/sdk build
pnpm --filter @ecency/sdk test
```

## Common Gotchas

1. **Guard undefined params** — TanStack Query's `enabled` flag prevents automatic fetches but NOT direct `queryClient.fetchQuery()` calls. Always add a falsy guard that returns `{ enabled: false, queryFn: () => null }` when required params are missing.
2. **Use query option builders, not hooks** — SDK exports `getXQueryOptions()` functions, not `useX()` hooks. This keeps them usable for SSR prefetching and non-React contexts.
3. **Rebuild SDK** after changes — `pnpm --filter @ecency/sdk build`
4. **DMCA filtering** — Use `filterDmcaEntry` utility for post queries to filter flagged content
5. **RPC failover** — The `CONFIG.hiveClient` handles node failover automatically. Don't cache the client address — it may change during a request.
