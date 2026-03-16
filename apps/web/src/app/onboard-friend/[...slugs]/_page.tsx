"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  params: { slugs: string[] };
}

/**
 * Legacy redirect: /onboard-friend/{type}/{hash} → /signup/invited/{hash}
 * Old format had asking/creating prefix; new format uses hash directly.
 */
export const OnboardFriend = ({ params: { slugs } }: Props) => {
  const router = useRouter();

  useEffect(() => {
    // The hash is the last slug (old URL: /onboard-friend/creating/{hash})
    const hash = slugs[slugs.length - 1];
    router.replace(hash ? `/signup/invited/${hash}` : "/signup/invited");
  }, [router, slugs]);

  return null;
};
