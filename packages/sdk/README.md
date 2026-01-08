# @ecency/sdk

Framework-agnostic data layer for Hive apps with first-class React Query support.

## What’s Inside

- Query and mutation option builders powered by [@tanstack/react-query](https://tanstack.com/query)
- Modular APIs: accounts, posts, communities, market, wallet, notifications, analytics, integrations, core, auth, bridge, games, hive-engine, operations, points, private-api, promotions, proposals, resource-credits, search, spk, witnesses
- Central configuration via `CONFIG` / `ConfigManager` (RPC client, QueryClient)

## Installation

```sh
yarn add @ecency/sdk
# or
npm install @ecency/sdk
```

## Quick Start (React Query)

```ts
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

const { data, isLoading } = useQuery(getAccountFullQueryOptions("ecency"));
```

## Configuration

The SDK uses a shared configuration singleton for the Hive RPC client and query client.

```ts
import { ConfigManager, makeQueryClient } from "@ecency/sdk";

// Optional: provide your own QueryClient
ConfigManager.setQueryClient(makeQueryClient());
```

If your app sets up a custom Hive client, configure it at startup so all SDK
modules share the same instance.

## Query Options vs Direct Calls

Most APIs are exposed as **query option builders** to keep caching consistent:

```ts
import { getPostsRankedQueryOptions } from "@ecency/sdk";

// Use in React Query hooks
useQuery(getPostsRankedQueryOptions("trending", "", "", 20));
```

Direct request helpers still exist for non-React contexts (e.g., server jobs).
Prefer query options in UI code.

## Mutations

Mutations are provided as hooks that wrap `useMutation`:

```ts
import { useAccountUpdate } from "@ecency/sdk";

const auth = {
  accessToken,
  postingKey,
  loginType
};

const { mutateAsync } = useAccountUpdate(username, auth);
await mutateAsync({ metadata });
```

`AuthContext` properties are optional. The example above works without an
explicit `broadcast` function; the SDK will use `postingKey` or `accessToken`
if provided. If your app needs custom broadcasting (Keychain, HiveAuth, mobile),
add the optional `broadcast` function as shown below.

## Broadcasting and Auth Context

The SDK does not manage storage or platform-specific signers. Instead, it uses an
`AuthContext` that you pass from the app:

```ts
import type { AuthContext } from "@ecency/sdk";

const auth: AuthContext = {
  accessToken,
  postingKey,
  loginType,
  broadcast: async (operations, authority = "posting") => {
    // App-specific broadcaster (Keychain, HiveAuth, mobile wallet)
    return myBroadcaster(operations, authority);
  }
};
```

If `auth.broadcast` is provided, the SDK will call it for posting broadcasts and
keychain/hiveauth flows. Otherwise it falls back to:

- `postingKey` (direct signing via dhive)
- `accessToken` (Hivesigner)

## Active/Owner Key Signing

For operations that must be signed with Active or Owner authority, use
`useSignOperationByKey` and pass the appropriate private key:

```ts
import { useSignOperationByKey } from "@ecency/sdk";

const { mutateAsync } = useSignOperationByKey(username);
await mutateAsync({
  operation: ["account_update", { /* ... */ }],
  keyOrSeed: activeKey
});
```

If you want the SDK to broadcast Active/Owner operations through an external
signer (Keychain, HiveAuth, mobile), provide an `auth.broadcast` handler and
use the `authority` argument:

```ts
const auth = {
  broadcast: (ops, authority = "posting") => {
    return myBroadcaster(ops, authority);
  }
};
```

## Module Layout

```text
src/modules/
  accounts/           account data, relationships, mutations
  analytics/          activity tracking and stats
  auth/               login, tokens, and auth helpers
  bridge/             bridge API helpers
  communities/        community queries and utils
  core/               config, client, query manager, helpers
  games/              game-related endpoints
  hive-engine/        hive-engine data helpers
  integrations/       external integrations (hivesigner, 3speak, etc.)
  market/             market data and pricing
  notifications/      notification queries and enums
  operations/         operation signing helpers
  points/             points queries and mutations
  posts/              post queries, mutations, utils
  private-api/         private API helpers
  promotions/         promotion queries
  proposals/          proposal queries and mutations
  resource-credits/   RC stats helpers
  search/             search queries
  spk/                SPK data helpers
  wallet/             wallet-related queries and types
  witnesses/          witness queries and votes
```

## SSR / RSC Notes

- Query options are safe to use on the server, but hooks are client-only.
- If you use Next.js App Router, keep hook usage in client components.

## Versioning

See `CHANGELOG.md` for release notes.
