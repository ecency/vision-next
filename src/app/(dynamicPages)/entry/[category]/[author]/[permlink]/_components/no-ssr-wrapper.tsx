"use client";

import { ReactNode, useEffect, useState } from "react";

interface NoSSRWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * NoSSRWrapper ensures that its children are only rendered on the client side,
 * preventing hydration mismatches when server and client render different content.
 */
export function NoSSRWrapper({ children, fallback = null }: NoSSRWrapperProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}