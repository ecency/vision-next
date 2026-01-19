# @ecency/ui

Shared UI components for Ecency applications. These components are designed to work with both the main Ecency web application and the self-hosted blog application.

## Installation

```bash
pnpm add @ecency/ui
```

## Features

- **Framework agnostic**: Components accept callbacks instead of framework-specific dependencies
- **Tailwind CSS ready**: Uses Tailwind utility classes for styling
- **Accessible**: ARIA labels, keyboard navigation, and semantic HTML
- **SSR compatible**: Handles hydration gracefully
- **TypeScript**: Full type definitions included

## Components

### UserAvatar

Displays a Hive user's profile avatar.

```tsx
import { UserAvatar } from '@ecency/ui';

// Basic usage
<UserAvatar username="ecency" />

// With click handler
<UserAvatar
  username="ecency"
  size="large"
  onClick={() => navigate('/profile')}
/>

// Custom proxy
<UserAvatar
  username="ecency"
  imageProxyBase="https://my-proxy.com"
/>
```

**Props:**
- `username` (required): Hive username
- `size`: `'xsmall' | 'small' | 'medium' | 'large' | 'xlarge'`
- `src`: Custom image source
- `imageProxyBase`: Image proxy URL (default: `https://images.ecency.com`)
- `onClick`: Click handler
- `className`: Additional CSS classes

### ErrorMessage

Displays an error state with optional retry functionality.

```tsx
import { ErrorMessage } from '@ecency/ui';

<ErrorMessage
  message="Failed to load data"
  onRetry={() => refetch()}
  retryText="Try again"
/>
```

**Props:**
- `message`: Error message to display
- `onRetry`: Callback for retry button
- `retryText`: Custom retry button text
- `icon`: Custom icon component
- `className`: Additional CSS classes

### VoteButton

Allows users to upvote/downvote Hive content.

```tsx
import { VoteButton } from '@ecency/ui';

<VoteButton
  author="ecency"
  permlink="my-post"
  activeVotes={votes}
  currentUser="myuser"
  isAuthenticated={true}
  onVote={async ({ author, permlink, weight }) => {
    await broadcastVote(author, permlink, weight);
  }}
  onAuthRequired={() => router.push('/login')}
/>
```

**Props:**
- `author` (required): Post author
- `permlink` (required): Post permlink
- `activeVotes` (required): Array of votes
- `currentUser`: Current user's username
- `isAuthenticated`: Whether user is logged in
- `isVotingEnabled`: Whether voting is enabled
- `onVote`: Vote handler
- `onAuthRequired`: Called when unauthenticated user clicks
- `showCount`: Show vote count
- `labels`: Custom label strings
- `icon`: Custom icon component

### ReblogButton

Allows users to reblog/share Hive content.

```tsx
import { ReblogButton } from '@ecency/ui';

<ReblogButton
  author="ecency"
  permlink="my-post"
  reblogCount={5}
  currentUser="myuser"
  isAuthenticated={true}
  onReblog={async ({ author, permlink }) => {
    await broadcastReblog(author, permlink);
  }}
/>
```

### Skeleton & Spinner

Loading state components.

```tsx
import { Skeleton, Spinner } from '@ecency/ui';

// Skeleton for content placeholders
<Skeleton width="w-full" height="h-4" count={3} />

// Spinner for loading indicators
<Spinner size="large" label="Loading..." />
```

## Hooks

### useMounted

Track if component has mounted (useful for SSR).

```tsx
import { useMounted } from '@ecency/ui';

function MyComponent() {
  const hasMounted = useMounted();
  if (!hasMounted) return <Placeholder />;
  return <ClientOnlyContent />;
}
```

### useWebpSupport

Detect WebP image format support.

```tsx
import { useWebpSupport } from '@ecency/ui';

function MyImage() {
  const supportsWebp = useWebpSupport();
  const src = supportsWebp ? 'image.webp' : 'image.jpg';
  return <img src={src} />;
}
```

## Styling

Components use Tailwind CSS utility classes. To use them in your application:

1. Make sure Tailwind CSS is configured in your project
2. Components will inherit your Tailwind theme (colors, spacing, etc.)
3. Use the `className` prop for additional customization

## TypeScript

All components are fully typed. Key types:

```tsx
import type {
  Size,
  Vote,
  AuthContext,
  UserAvatarProps,
  VoteButtonProps,
} from '@ecency/ui';
```

## License

MIT
