"use client";

import { PropsWithChildren, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@ui/button";

type NotFoundBackButtonProps = PropsWithChildren<{
  fallbackHref: string;
}>;

export function NotFoundBackButton({ fallbackHref, children }: NotFoundBackButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }, [fallbackHref, router]);

  return (
    <Button type="button" onClick={handleClick}>
      {children}
    </Button>
  );
}
