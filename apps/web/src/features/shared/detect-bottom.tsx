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

  // Class lets list surfaces detect "nothing here but the sentinel" via :has().
  return <div ref={ref} className="detect-bottom" />;
}
