# Changelog

## 2.0.9

### Patch Changes

- Performance optimizations (#667)

## 2.0.7

### Patch Changes

- Fix assets list (#664)

## 2.0.6

### Patch Changes

- Marking notification, joining community fixes (#663)

## 2.0.5

### Patch Changes

- SDK error catching (#660)

## 2.0.4

### Patch Changes

- Test and edge case fixes (#659)

## 2.0.3

### Patch Changes

- Fix: Friends active data (#656)

## 2.0.2

### Patch Changes

- Wallets simplified, SDK Mutations unified (#653)

## 2.0.1

### Patch Changes

- Fix optimistic replies (#652)
- Optimistic updates (#651)

## 2.0.0

### Major Changes

This is a major release that introduces the Smart Auth Strategy system, significantly improving authentication performance and user experience.

#### Breaking Changes

- **PlatformAdapter.showAuthUpgradeUI return type changed**
  - **Before:** `Promise<'hiveauth' | 'hivesigner' | false>`
  - **After:** `Promise<'hiveauth' | 'hivesigner' | 'key' | false>`
  - **Reason:** Added support for manual key entry option in auth upgrade flow
  - **Migration:** Update `showAuthUpgradeUI` implementations to handle `'key'` return value
  - **Important:** The return type is intentionally limited to the **most common fallback methods**:
    - `'hiveauth'` - QR code + mobile app authentication
    - `'hivesigner'` - OAuth-based authentication
    - `'key'` - Manual key entry (temporary use)
    - `false` - User cancelled
  - **Note:** While `broadcastWithMethod()` supports all auth methods (`'key' | 'hiveauth' | 'hivesigner' | 'keychain' | 'custom'`), the auth upgrade UI intentionally only offers the above subset for better UX. If you need to support additional methods like `'keychain'` or `'custom'` in the upgrade flow:
    1. Update the return type in `PlatformAdapter.showAuthUpgradeUI` (packages/sdk/src/modules/core/types/platform-adapter.ts)
    2. The handler in `broadcastWithMethod()` (packages/sdk/src/modules/core/mutations/use-broadcast-mutation.ts) will automatically support it - no code changes needed there
  - **See:** `showAuthUpgradeUI` in platform-adapter.ts and `broadcastWithMethod()` in use-broadcast-mutation.ts for implementation details

#### New Features

**Smart Auth Strategy**

- Added `getLoginType()` to PlatformAdapter for determining user's actual auth method
- Eliminated blind fallback chains - now uses user's specific auth method directly
- 2-4x performance improvement (no unnecessary auth attempts)
- Predictable behavior with better error messages

**Authority Detection System**

- New `OPERATION_AUTHORITY_MAP` with 61 operations mapped to authority levels
- Automatic detection of `posting` | `active` | `owner` | `memo` requirements
- `getRequiredAuthority(operation)` helper for authority lookup
- `getProposalAuthority(operation)` for content-dependent operations

**Enhanced Platform Adapter**

- Added `hasPostingAuthorization(username)` - Check if ecency.app has posting authority
- Added `showAuthUpgradeUI(authority, operation)` - Prompt user for auth upgrade
- Added `grantPostingAuthority(username)` - Automatically grant posting authority
- Added `getOwnerKey(username)` - Optional owner key retrieval
- Added `getMemoKey(username)` - Optional memo key retrieval

**Operation Builders**

- New `buildAccountUpdateOp()` - Construct account_update operations
- Type-safe operation construction with Authority types

#### Performance Improvements

- **50% reduction in credential fetches** - Eliminated duplicate key/token fetching in fallback chain
- **Pre-fetch optimization** - Keys and tokens fetched once and reused
- **Faster auth upgrades** - No redundant HiveSigner token fetching

#### Bug Fixes

- Fixed missing operations in authority map (5 operations added)
- Fixed empty operations array crash with guard check
- Fixed authority guard for legacy auth to prevent silent failures
- Fixed owner/memo key checks in fallback chain
- Enhanced error pattern matching (now checks both error.error_description and error.message)
- Improved mutation resilience (recordActivity errors won't block cache invalidation)

#### Developer Experience

- Added comprehensive JSDoc documentation for all new methods
- Created mobile broadcast adapter reference implementation
- Established web broadcast adapter pattern
- All 250 tests passing with new features
- Bundle size impact: +1.8KB for major functionality improvement

### Migration Guide

**For Mobile Apps:**

```typescript
// Update your mobile adapter to implement new methods
export function createMobileBroadcastAdapter(): PlatformAdapter {
  return {
    // ... existing methods ...

    // NEW: Add these methods
    getOwnerKey: async (username) => {
      /* implementation */
    },
    getMemoKey: async (username) => {
      /* implementation */
    },
    hasPostingAuthorization: async (username) => {
      /* implementation */
    },
    showAuthUpgradeUI: async (authority, operation) => {
      // Must now return 'hiveauth' | 'hivesigner' | 'key' | false
    },
    grantPostingAuthority: async (username) => {
      /* implementation */
    },
  };
}
```

**For Web Apps:**

```typescript
// Create web adapter following established pattern
import { createWebBroadcastAdapter } from "@/providers/sdk";

// In your mutation hooks
export function useVoteMutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();

  return useVote(activeUser?.username, { adapter });
}
```

---

## 1.5.28

### Patch Changes

- SDK mutation hooks and adapters (#648)

## 1.5.27

### Patch Changes

- Insights fix (#644)

## 1.5.26

### Patch Changes

- Fix insights (#642)

## 1.5.25

### Patch Changes

- Missing methods on SDK (#641)

## 1.5.24

### Patch Changes

- Improve sdk and bug fixes (#639)

## 1.5.23

### Patch Changes

- Version bump (#638)

## 1.5.22

### Patch Changes

- [#635](https://github.com/ecency/vision-next/pull/635) [`de07860`](https://github.com/ecency/vision-next/commit/de0786095e6f51447898d0ec6b0e3e0cc9434c19) Thanks [@feruzm](https://github.com/feruzm)! - External importing and missing sdk (#635)

## 1.5.0

### Breaking changes

- Require caller-supplied access tokens for private API queries and mutations (e.g., drafts, schedules, images, gallery images).
- Update fragments APIs to accept access tokens: `useAddFragment(username, code)`, `useEditFragment(username, fragmentId, code)`, `useRemoveFragment(username, fragmentId, code)`, and `getFragmentsQueryOptions(username, code)`.
- Require access tokens for query options such as `getDraftsQueryOptions`, `getSchedulesQueryOptions`, `getImagesQueryOptions`, and `getGalleryImagesQueryOptions`.
- Require caller-supplied auth data for broadcast helpers instead of reading from SDK storage (e.g., posting key/login type for `broadcastJson` and `useBroadcastMutation`).
