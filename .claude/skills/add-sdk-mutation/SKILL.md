---
name: add-sdk-mutation
description: Add a new blockchain mutation to @ecency/sdk and wire it up in the web app
argument-hint: [operation-name]
disable-model-invocation: true
---

# Add SDK Mutation

Create a new Hive blockchain mutation in `@ecency/sdk` and wire it into the web app.

## Context

All blockchain mutations live in `@ecency/sdk` and follow a 3-layer architecture:

```
@ecency/sdk (platform-agnostic mutation hook)
    ↓ wrapped by
apps/web/src/api/sdk-mutations/ (web-specific wrapper adding auth adapter)
    ↓ used by
apps/web/src/api/mutations/ (app-specific orchestration: optimistic updates, error handling)
    ↓ used by
Feature components
```

## Step 1: Create the SDK Mutation Hook

Location: `packages/sdk/src/modules/<domain>/mutations/use-<operation>.ts`

Use an existing mutation as a reference. Key patterns:

```typescript
import { useBroadcastMutation, AuthorityLevel } from "@/modules/core/mutations/use-broadcast-mutation";
import { AuthContextV2 } from "@/modules/core/types/auth";

export function use<Operation>(username?: string, auth?: AuthContextV2) {
  return useBroadcastMutation(
    ["<operation-key>"],
    async (args: { /* mutation params */ }) => {
      // Build and return the Hive operation(s)
      return [
        [
          "<hive_operation_name>",
          {
            // operation fields
          }
        ]
      ];
    },
    username,
    auth,
    {
      authorityLevel: AuthorityLevel.POSTING, // or ACTIVE for transfers/delegations
      // onSuccess, onMutate, onError for cache management
    }
  );
}
```

**Authority levels:**
- `POSTING` — votes, comments, reblogs, follows, community roles
- `ACTIVE` — transfers, delegations, power up/down, account updates
- `OWNER` — password changes (rare)

**Reference files to study:**
- Simple: `packages/sdk/src/modules/posts/mutations/use-vote.ts`
- With cache updates: `packages/sdk/src/modules/posts/mutations/use-reblog.ts`
- Complex: `packages/sdk/src/modules/posts/mutations/use-comment.ts`

## Step 2: Export from Module Index

Add the export to the module's `index.ts`:
```typescript
// packages/sdk/src/modules/<domain>/index.ts
export * from "./mutations/use-<operation>";
```

Verify it's re-exported from the SDK root via the module chain.

## Step 3: Add QueryKeys (if cache invalidation needed)

Location: `packages/sdk/src/modules/core/query-keys.ts`

```typescript
// Add to the relevant domain namespace
static <domain> = {
  _prefix: ["<domain>"] as const,
  <operation>: (param: string) => [...QueryKeys.<domain>._prefix, "<operation>", param] as const,
};
```

## Step 4: Create Web Wrapper

Location: `apps/web/src/api/sdk-mutations/use-<operation>-mutation.ts`

Every web wrapper follows this exact pattern:

```typescript
import { use<Operation> } from "@ecency/sdk";
import { useActiveAccount } from "@/core/global-store/modules/authentication";
import { createWebBroadcastAdapter } from "@/providers/sdk";

export function use<Operation>Mutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return use<Operation>(activeUser?.username, { adapter });
}
```

Add the export to `apps/web/src/api/sdk-mutations/index.ts`.

## Step 5: Build and Test

```bash
# Rebuild SDK so web app sees the changes
pnpm --filter @ecency/sdk build

# Run SDK tests
pnpm --filter @ecency/sdk test

# Run web tests
pnpm --filter @ecency/web test
```

## Common Gotchas

1. **Always rebuild SDK** after changes — web app imports from built output, not source
2. **Don't add heavy dependencies** to SDK — it must stay lightweight (~182KB)
3. **Use QueryKeys from SDK** for cache invalidation, never hardcoded arrays
4. **Platform-specific concerns stay in web** — toasts (i18n), session storage, error formatting
5. **Auth upgrade**: If operation needs active key but user logged in with posting key, the adapter's `showAuthUpgradeUI` handles this automatically via `useBroadcastMutation`
6. **HiveSigner optimization**: For posting ops, the broadcast system tries HiveSigner token first (faster) when user has granted posting authority to ecency.app
