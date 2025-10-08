"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  path: string;
}

export function Redirect({ path }: Props) {
  const router = useRouter();

  useEffect(() => {
    router.push(path);
  }, [path, router]);

  return <></>;
}
