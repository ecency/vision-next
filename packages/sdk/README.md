# @ecency/sdk

Framework-agnostic data layer for Hive apps with first-class React Query support.

## What’s Inside

- Query and mutation option builders powered by [@tanstack/react-query](https://tanstack.com/query)
- Modular APIs: accounts, posts, communities, market, wallet, notifications, analytics, integrations
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

## Broadcasting and Auth Context

The SDK does not manage storage or platform-specific signers. Instead, it uses an
`AuthContext` that you pass from the app:

```ts
import type { AuthContext } from "@ecency/sdk";

const auth: AuthContext = {
  accessToken,
  postingKey,
  loginType,
  broadcast: async (operations, _auth, authority = "Posting") => {
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
import { PrivateKey } from "@hiveio/dhive";
import { useSignOperationByKey } from "@ecency/sdk";

const { mutateAsync } = useSignOperationByKey(username);
await mutateAsync({
  operation: ["account_update", { /* ... */ }],
  key: PrivateKey.fromString(activeKey)
});
```

If you want the SDK to broadcast Active/Owner operations through an external
signer (Keychain, HiveAuth, mobile), provide an `auth.broadcast` handler and
use the `authority` argument:

```ts
const auth = {
  broadcast: (ops, _auth, authority = "Posting") => {
    return myBroadcaster(ops, authority);
  }
};
```

## Module Layout

```
src/modules/
  accounts/       queries, mutations, utils, types
  posts/          queries, mutations, utils, types
  communities/    queries, types, utils
  market/         queries, requests, types
  wallet/         queries, types
  notifications/  queries, enums
  core/           config, client, query manager, helpers
```

## SSR / RSC Notes

- Query options are safe to use on the server, but hooks are client-only.
- If you use Next.js App Router, keep hook usage in client components.

## Versioning

See `CHANGELOG.md` for release notes.
