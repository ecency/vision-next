import { ReadingListLoading } from "@/features/shared/reading-layout/reading-list-loading";

// Leaf boundary, deliberately NOT inherited from profile/[username].
//
// The parent loading module used to sit one level up and cover every profile
// tab. That also put a Suspense boundary above profile/[username]/page.tsx,
// which awaits the account, the feed page and the pinned entry before it
// returns JSX: the shell flushed with this skeleton and the feed cards arrived
// in a hidden segment that a $RC swap script revealed later (#1787, same shape
// as #1783/#1778). Deleting the parent gives the profile index its cards in the
// SSR shell; this file keeps THIS tab's pending UI exactly as it was.
export default function FollowersLoading() {
  return <ReadingListLoading />;
}
