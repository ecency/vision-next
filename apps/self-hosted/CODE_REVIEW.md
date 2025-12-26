# Code Review: Blog Post Page Implementation

## 🔴 Critical Issues

### 1. Type Safety Violations
**Location:** `blog-post-page.tsx:13-19`
```typescript
const params = useParams({ strict: false });
const author = (params.author as string)?.replace("@", "") || "";
```

**Issues:**
- Using `strict: false` defeats TypeScript's type safety
- Type assertions without validation (`as string`)
- No runtime validation of route parameters
- Could cause runtime errors if params are undefined

**Recommendation:**
```typescript
// Define proper route params type
type RouteParams = {
  author: string;
  permlink: string;
  category?: string;
};

const params = Route.useParams();
const author = params.author?.replace(/^@/, "") ?? "";
if (!author || !params.permlink) {
  throw new Error("Invalid route parameters");
}
```

### 2. Direct CONFIG Import
**Location:** `blog-post-discussion.tsx:5`
```typescript
import { CONFIG } from "@ecency/sdk";
```

**Issues:**
- Bypasses SDK abstraction layer
- Tight coupling to internal implementation
- Makes testing difficult
- Should use SDK's query functions instead

**Recommendation:**
- Create a proper `getDiscussionsQueryOptions` in SDK
- Or use a custom hook that wraps the CONFIG access

### 3. Performance: Sorting in Query Function
**Location:** `blog-post-discussion.tsx:54-70`
```typescript
queryFn: async () => {
  const response = await CONFIG.hiveClient.call(...);
  const comments = Object.values(response) as Entry[];
  return sortDiscussions(entryData, comments, order); // ❌ Sorting on every fetch
}
```

**Issues:**
- Sorting happens on every query execution
- Should use `select` option in React Query
- Sorting should be memoized
- Query refetches when order changes, causing unnecessary API calls

**Recommendation:**
```typescript
const { data: allComments = [] } = useQuery({
  queryKey: ["discussions", entryData.author, entryData.permlink], // Remove order from key
  queryFn: async () => {
    const response = await CONFIG.hiveClient.call(...);
    return Object.values(response) as Entry[];
  },
  select: (data) => sortDiscussions(entryData, data, order), // Sort in select
});
```

### 4. Missing Error Handling
**Location:** Multiple files

**Issues:**
- No error boundaries
- Generic error messages
- No retry logic
- No error logging
- Silent failures in discussion queries

**Recommendation:**
- Add error boundaries
- Implement proper error types
- Add retry logic with exponential backoff
- Log errors to monitoring service

## 🟡 Major Issues

### 5. Inefficient Filtering
**Location:** `blog-discussion-item.tsx:33-38`
```typescript
const repliesCount = useMemo(
  () =>
    discussionList.filter(
      (x) => x.parent_author === entry.author && x.parent_permlink === entry.permlink
    ).length,
  [discussionList, entry]
);
```

**Issues:**
- Filters entire list for each comment
- O(n²) complexity for nested comments
- Should build a map/index once

**Recommendation:**
```typescript
// Build index once at parent level
const repliesIndex = useMemo(() => {
  const index = new Map<string, Entry[]>();
  discussionList.forEach(comment => {
    const key = `${comment.parent_author}/${comment.parent_permlink}`;
    if (!index.has(key)) index.set(key, []);
    index.get(key)!.push(comment);
  });
  return index;
}, [discussionList]);

const repliesCount = repliesIndex.get(`${entry.author}/${entry.permlink}`)?.length ?? 0;
```

### 6. Using `href` Instead of Router Links
**Location:** Multiple files (header, footer, discussion-item)

**Issues:**
- Full page reloads instead of client-side navigation
- Loses React state
- Poor UX
- Not using TanStack Router's `Link` component

**Recommendation:**
```typescript
import { Link } from "@tanstack/react-router";

<Link to="/trending/$tag" params={{ tag }}>#{tag}</Link>
```

### 7. Missing Memoization
**Location:** `blog-post-header.tsx`, `blog-post-footer.tsx`

**Issues:**
- Components re-render unnecessarily
- `entryData` calculation repeated in multiple components
- No memoization of expensive computations

**Recommendation:**
```typescript
export const BlogPostHeader = memo(function BlogPostHeader({ entry }: Props) {
  const entryData = useMemo(() => entry.original_entry || entry, [entry]);
  // ...
});
```

### 8. Hard-coded Constants
**Location:** `blog-post-header.tsx:17`
```typescript
const wordsPerMinute = 225;
```

**Issues:**
- Magic numbers scattered throughout code
- No central configuration
- Difficult to adjust

**Recommendation:**
Create `constants.ts`:
```typescript
export const READING_SPEED = {
  WORDS_PER_MINUTE: 225,
} as const;
```

### 9. Missing Accessibility
**Location:** All components

**Issues:**
- No ARIA labels
- Missing semantic HTML
- No keyboard navigation support
- Missing alt text for icons
- Button without proper type

**Recommendation:**
```typescript
<button
  type="button"
  aria-label={`${repliesCount} replies. Click to ${showReplies ? 'hide' : 'show'} replies`}
  aria-expanded={showReplies}
  onClick={() => setShowReplies(!showReplies)}
>
```

### 10. Query Key Management
**Location:** `blog-post-discussion.tsx:55`

**Issues:**
- Inconsistent query key structure
- No query key factory
- Hard to invalidate related queries

**Recommendation:**
```typescript
// Create query key factory
export const discussionKeys = {
  all: ['discussions'] as const,
  byPost: (author: string, permlink: string) => 
    [...discussionKeys.all, author, permlink] as const,
};

// Usage
queryKey: discussionKeys.byPost(entryData.author, entryData.permlink),
```

## 🟢 Minor Issues & Improvements

### 11. Missing Loading States
- No skeleton loaders
- Basic "Loading..." text
- Should show content structure while loading

### 12. Date Formatting
**Location:** `blog-post-header.tsx:46-49`
- Using `formatDistanceToNow` which updates on every render
- Should use static date or memoize properly
- Consider timezone handling

### 13. Empty State Messages
- Generic "No comments yet"
- Could be more engaging
- Missing call-to-action

### 14. Type Definitions
- `SortOrder` type defined locally
- Should be in shared types file
- Missing JSDoc comments

### 15. Component Organization
- All components in one directory
- Could benefit from feature-based organization
- Missing index files for cleaner imports

### 16. Missing Tests
- No unit tests
- No integration tests
- No E2E tests

### 17. Route Validation
**Location:** Route files
- Search validation returns `undefined` which is inconsistent
- Should use proper schema validation (zod)

**Recommendation:**
```typescript
import { z } from 'zod';

const searchSchema = z.object({
  raw: z.boolean().optional(),
});

validateSearch: (search) => searchSchema.parse(search),
```

### 18. XSS Concerns
- Relying on EcencyRenderer for sanitization
- Should document security assumptions
- Consider additional sanitization layer

### 19. Performance: Large Comment Lists
- No virtualization
- Could cause performance issues with 100+ comments
- Consider `react-window` or `react-virtual`

### 20. Missing Error Recovery
- No retry buttons
- No "Try again" functionality
- Users stuck on error state

## 📋 Recommendations Summary

### High Priority
1. ✅ Fix type safety issues
2. ✅ Move sorting to `select` option
3. ✅ Replace `href` with Router `Link`
4. ✅ Add proper error handling
5. ✅ Optimize filtering with indexes

### Medium Priority
6. ✅ Add memoization to components
7. ✅ Extract constants
8. ✅ Improve accessibility
9. ✅ Create query key factories
10. ✅ Add loading skeletons

### Low Priority
11. ✅ Add tests
12. ✅ Improve empty states
13. ✅ Add virtualization for long lists
14. ✅ Improve error recovery UX

## 🎯 Code Quality Score: 6.5/10

**Strengths:**
- Good component separation
- Proper use of React Query
- Clean component structure
- Responsive design considerations

**Weaknesses:**
- Type safety issues
- Performance optimizations needed
- Missing error handling
- Accessibility gaps
- Testing coverage

