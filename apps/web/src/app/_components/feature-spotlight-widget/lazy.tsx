"use client";

import dynamic from "next/dynamic";

// Client-only: the widget reads localStorage (dismissal) and the active-user store, so
// SSR would render a card that may be dismissed/empty on the client and flash. ssr:false
// avoids the flash and keeps it off the First Load JS. It is the last item in the feed
// sidebar with nothing below it, so an empty `loading` does not shift main content.
export const FeatureSpotlightWidget = dynamic(
  () => import("./index").then((m) => m.FeatureSpotlightWidget),
  {
    ssr: false,
    loading: () => null
  }
);
