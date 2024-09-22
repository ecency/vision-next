"use client";

import { useInViewport } from "react-in-viewport";
import { useRef } from "react";
import { useDebounce } from "react-use";

interface Props {
  onBottom: () => any;
}

export function DetectBottom({ onBottom }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { inViewport } = useInViewport(ref);

  useDebounce(
    () => {
      if (inViewport) {
        onBottom();
      }
    },
    500,
    [inViewport]
  );

  return <div ref={ref} />;
}
