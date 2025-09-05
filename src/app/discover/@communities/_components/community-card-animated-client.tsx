"use client";

import dynamic from "next/dynamic";

const CommunityCardAnimated = dynamic(() => import("./community-card-animated"), {
  ssr: false
});

export default CommunityCardAnimated;
