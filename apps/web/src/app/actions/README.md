# Server Actions

This directory contains Next.js Server Actions for server-side operations.

## Revalidate Entry Action

### Usage

Call this Server Action after successfully publishing or editing a post to immediately revalidate the cached page:

```typescript
import { revalidateEntryAction } from "@/app/actions/revalidate-entry";

// After successful post publish/edit
async function handlePublishSuccess(author: string, permlink: string) {
  const result = await revalidateEntryAction(author, permlink);

  if (result.success) {
    console.log("Entry revalidated:", result.paths);
    // User will see updates immediately
  } else {
    console.error("Revalidation failed:", result.error);
    // Still works, just waits for ISR revalidation (60s)
  }
}
```

### Security

- **Authentication Required**: Only authenticated users can trigger revalidation
- **Authorization Required**: Users can only revalidate their own posts
- **Automatic**: Session is verified server-side via cookies
- **Logged**: Unauthorized attempts are logged for security monitoring

### Integration Example

```typescript
// In your publish mutation success handler:
const { mutateAsync: publishPost } = useMutation({
  mutationFn: async (data) => {
    // Publish to Hive blockchain
    const result = await comment(
      username,
      parentAuthor,
      parentPermlink,
      permlink,
      title,
      body,
      jsonMetadata,
      options
    );

    return result;
  },
  onSuccess: async (result, variables) => {
    // Immediately revalidate the entry page
    await revalidateEntryAction(variables.author, variables.permlink);

    // Show success message
    success("Post published successfully!");

    // Navigate to the post
    router.push(`/@${variables.author}/${variables.permlink}`);
  }
});
```

### Error Handling

The action returns a result object with:

```typescript
type Result = {
  success: boolean;
  paths?: string[];          // Paths that were revalidated
  timestamp?: number;        // When revalidation occurred
  error?: string;            // Error message if failed
}
```

Possible errors:
- `"Missing author or permlink"` - Invalid parameters
- `"Unauthorized: No active session"` - User not logged in
- `"Unauthorized: You can only revalidate your own posts"` - User is not the author
- Other errors from Next.js revalidation

### Performance Impact

- **Before revalidation**: Users wait up to 60 seconds to see edits (ISR cache)
- **After revalidation**: Users see edits immediately (on-demand cache invalidation)
- **For other visitors**: Still get fast cached pages (no performance impact)

### Best Practices

1. ✅ **DO** call after successful post publish/edit
2. ✅ **DO** handle errors gracefully (revalidation is optional, ISR will catch up)
3. ✅ **DO** use this for immediate feedback to authors
4. ❌ **DON'T** call excessively (rate limiting may be added in the future)
5. ❌ **DON'T** call for posts you didn't author (will fail authorization)
