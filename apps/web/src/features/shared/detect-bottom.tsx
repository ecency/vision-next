"use client";

import { useInViewport } from "react-in-viewport";
import { useEffect, useRef } from "react";

interface Props {
  onBottom: () => any;
}

export function DetectBottom({ onBottom }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { inViewport } = useInViewport(ref, { rootMargin: "0px 0px 200px 0px" });

  useEffect(() => {
    if (inViewport) {
      onBottom();
    }
  }, [inViewport, onBottom]);

  return <div ref={ref} />;
}
