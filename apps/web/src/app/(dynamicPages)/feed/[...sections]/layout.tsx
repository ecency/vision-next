import { PropsWithChildren } from "react";

interface Params {
  params: Promise<{ sections: string[] }>;
}

/**
 * Pass-through.
 *
 * This layout used to host a server-rendered thumbnail preload inside its own
 * `<Suspense fallback={null}>`. That existed because `loading.tsx` put the page
 * in a boundary and React holds a boundary's hoisted `<link>`s until it
 * flushes, so a preload rendered by the page landed after ~380KB of RSC
 * payload. #1786 removed that boundary, and with the cards in the SSR shell the
 * first ones render `next/image` with `priority`, which hoists the same
 * preloads into `<head>` on its own.
 *
 * Measured on the streamed HTML with and without the layout component: the
 * preload links for the eager cards appear at byte 0 and byte 106 either way,
 * identical URLs. The component only re-emitted links the cards already emit,
 * so it is gone, and with it the last Suspense boundary anywhere on this
 * route's chain.
 *
 * Keep it that way: a boundary here would have to sit beside `{children}`,
 * never around them, or the cards go back into a hidden segment behind a $RC
 * swap script. The structure spec pins that this file contains no Suspense.
 */
export default function FeedSectionsLayout({ children }: PropsWithChildren<Params>) {
  return <>{children}</>;
}
