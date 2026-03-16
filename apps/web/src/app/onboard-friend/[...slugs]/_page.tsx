"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  params: { slugs: string[] };
}

/**
 * Legacy redirect:
 *   /onboard-friend/asking/{hash}   → /signup/invited     (visitor key-gen, no hash needed)
 *   /onboard-friend/creating/{hash} → /signup/invited/{hash} (sponsor account-creation)
 *   /onboard-friend/{hash}          → /signup/invited/{hash} (direct link)
 */
export const OnboardFriend = ({ params: { slugs } }: Props) => {
  const router = useRouter();

  useEffect(() => {
    const type = slugs[0];
    const hash = slugs[1] ?? slugs[0];

    // "asking" was the visitor flow — redirect to visitor page (no hash)
    if (type === "asking") {
      router.replace("/signup/invited");
    } else if (type === "creating") {
      router.replace(slugs[1] ? `/signup/invited/${encodeURIComponent(slugs[1])}` : "/signup/invited");
    } else {
      router.replace(hash ? `/signup/invited/${encodeURIComponent(hash)}` : "/signup/invited");
    }
  }, [router, slugs]);

  return null;
};
