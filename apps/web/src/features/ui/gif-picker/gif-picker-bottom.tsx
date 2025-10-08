import { useInViewport } from "react-in-viewport";
import { useEffect, useRef } from "react";

interface Props {
  onVisible: () => void;
}

export function GifPickerBottom({ onVisible }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { inViewport } = useInViewport(ref, {
    rootMargin: "0px 0px 200px 0px"
  });

  useEffect(() => {
    if (inViewport) {
      onVisible();
    }
  }, [inViewport, onVisible]);

  return <div ref={ref} className="h-2 w-full" />;
}
