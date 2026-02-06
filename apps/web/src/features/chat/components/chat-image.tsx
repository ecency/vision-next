"use client";

import { useEffect, useRef, useState } from "react";
import mediumZoom, { Zoom } from "medium-zoom";

interface ChatImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ChatImage({ src, alt = "Shared image", className }: ChatImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const zoomRef = useRef<Zoom | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !isLoaded) return;

    // Create zoom instance for this image
    zoomRef.current = mediumZoom(img, {
      background: "#131111",
      margin: 24
    });

    return () => {
      zoomRef.current?.detach();
      zoomRef.current = null;
    };
  }, [isLoaded]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className ?? "max-h-80 max-w-full rounded border border-[--border-color] object-contain cursor-zoom-in"}
      onLoad={() => setIsLoaded(true)}
    />
  );
}
