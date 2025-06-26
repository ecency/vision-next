// app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/client-entry-footer-controls.tsx
"use client";

import dynamic from "next/dynamic";

const EntryFooterControls = dynamic(() => import("./entry-footer-controls"), {
    ssr: false,
    loading: () => <div className="h-12" />  // optional loading UI
});

export default EntryFooterControls;
