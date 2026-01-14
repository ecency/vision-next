# API Query Tests

This directory contains comprehensive test suites for key API query functions used in the web application.

## Test Files Created

### 1. get-account-posts-feed-query.spec.ts (23 tests)
Tests the complex feed query logic that handles:
- **Promoted posts section** - Fetches promoted entries from private API
- **Account-specific posts** - Handles @username or %40username formats
- **Feed section** - Uses resolvePosts:false flag for performance
- **Other sections** - Trending, hot, created posts
- **Edge cases** - Empty tags, undefined observer, URL encoding
- **Infinite query** - Prefetch, data retrieval, and hook usage

**Key functionality**:
- Routes to correct query function based on feed type
- Handles promoted vs account vs ranked posts
- Strips @ and %40 from usernames
- Supports observer parameter for personalized data

### 2. get-gifs-query.spec.ts (31 tests)
Tests GIF search functionality using Giphy API:
- **Query key generation** - Includes query string and limit
- **Initial state** - Empty pages and pageParams
- **Search vs trending** - Different endpoints for empty/non-empty queries
- **API integration** - API key, limit, offset parameters
- **Pagination** - getNextPageParam logic for infinite scroll
- **Edge cases** - Special characters, unicode, long queries

**Key functionality**:
- Integrates with Giphy API (search and trending endpoints)
- Infinite scroll pagination
- URL parameter encoding
- Response data extraction

### 3. get-contributors-query.spec.ts (11 tests)
Tests contributors list functionality:
- **Query key** - Uses CONTRIBUTORS identifier
- **Data loading** - Loads from JSON file
- **Shuffling** - Randomizes contributor order
- **Return structure** - Validates query options object

**Key functionality**:
- Loads contributor data from static JSON
- Shuffles list on each query
- Simple, cacheable query

### 4. image-downloader-query.spec.ts (22 tests)
Tests image downloading and conversion:
- **Query key generation** - Entry author, permlink, dimensions
- **WebP support** - Conditional WebP format usage
- **Blob conversion** - Converts blob to base64
- **Fallback handling** - Uses fallback image on error
- **Retry behavior** - 3000ms retry delay
- **Edge cases** - Large dimensions, blob conversion errors

**Key functionality**:
- Downloads images as blobs
- Converts to base64 for inline usage
- Supports WebP format when available
- Handles fallback images
- Uses global state for WebP capability detection

## Test Statistics

- **Total test files**: 4
- **Total test cases**: 87
- **Total lines of code**: ~1,850
- **Average tests per file**: ~22

## Coverage Areas

All tests cover:
- ✅ Query key generation and uniqueness
- ✅ Enabled/disabled conditions
- ✅ QueryFn behavior and API calls
- ✅ Edge cases (empty strings, unicode, long values)
- ✅ Return type validation
- ✅ Mock data handling
- ✅ Error handling and fallbacks

## Test Patterns Used

1. **Vitest + @testing-library/react** - For hook and component testing
2. **vi.mock** - For API and SDK mocking
3. **Query option testing** - Validating queryKey, queryFn, enabled
4. **Hook testing** - Using renderHook for React Query hooks
5. **Edge case testing** - Handling unusual inputs
6. **Type safety validation** - Ensuring correct return types

## Running Tests

```bash
# Run all API query tests
pnpm --filter @ecency/web test -- src/specs/api/queries

# Run specific test file
pnpm --filter @ecency/web test -- src/specs/api/queries/get-gifs-query.spec.ts

# Run in watch mode
pnpm --filter @ecency/web test -- --watch src/specs/api/queries

# Run with coverage
pnpm --filter @ecency/web test -- --coverage src/specs/api/queries
```

## Architecture Notes

### Why These Tests?

The tests focus on **web app-specific query logic**, not SDK functions:

- ❌ **Not tested here**: SDK query functions like `getPostQueryOptions`, `getAccountFullQueryOptions`
  - These are tested in the SDK package itself (`packages/sdk`)
  - The SDK has its own comprehensive test suite

- ✅ **Tested here**: Web app query wrappers and custom queries
  - `get-account-posts-feed-query.ts` - Complex routing logic for different feed types
  - `get-gifs-query.ts` - Giphy API integration (external service)
  - `get-contributors-query.ts` - Static data loading and shuffling
  - `image-downloader-query.ts` - Image fetching and blob conversion

### Integration with SDK

The web app imports query functions from `@ecency/sdk` and uses them directly:

```typescript
// Web app uses SDK queries
import { getPostQueryOptions, getAccountFullQueryOptions } from '@ecency/sdk';

// Web app wraps them for app-specific logic
export function prefetchGetPostsFeedQuery(what, tag, limit, observer) {
  if (isPromotedSection) {
    return prefetchInfiniteQuery(getPromotedEntriesInfiniteQuery());
  }
  if (isAccountPosts) {
    return prefetchInfiniteQuery(getAccountPostsInfiniteQueryOptions(...));
  }
  // ... more logic
}
```

The SDK tests validate the SDK functions work correctly. These tests validate the web app's **usage and orchestration** of those functions.

## Key Features Tested

### Feed Management
- Multiple feed types (promoted, trending, hot, created, feed)
- User-specific feeds (@username)
- Tag-based feeds
- Infinite scroll pagination
- Observer context for personalized data

### External APIs
- Giphy integration (search and trending)
- Image downloading with WebP support
- Error handling and fallbacks

### Static Data
- Contributor list loading
- Data randomization

### Image Handling
- Blob to base64 conversion
- WebP format support
- Fallback image handling
- Retry logic

## Future Test Coverage

Potential areas for additional tests:

1. **Mutation tests** - Testing API mutations in `/api/mutations/`
2. **Bridge API tests** - Testing complex `/api/bridge.ts` logic
3. **Private API tests** - Testing `/api/private-api.ts` endpoints
4. **Operation tests** - Testing blockchain operations

## Related Documentation

- SDK tests: `/packages/sdk/src/**/*.spec.ts`
- Test utilities: `/apps/web/src/specs/test-utils.tsx`
- Test setup: `/apps/web/src/specs/setup-any-spec.ts`
