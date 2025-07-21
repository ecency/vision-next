"use client";

import dynamic from "next/dynamic";

const HivePage = dynamic(() => import("./_page"), { ssr: false });

export default function Page() {
  return <HivePage />;
}
