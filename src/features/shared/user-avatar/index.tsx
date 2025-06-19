"use client";

import React, { useEffect, useMemo, useState } from "react";
import { proxifyImageSrc, setProxyBase } from "@ecency/render-helper";
import "./_index.scss";
import { useGlobalStore } from "@/core/global-store";
import defaults from "@/defaults.json";

setProxyBase(defaults.imageServer);

interface Props {
  username: string;
  size?: string;
  src?: string;
  onClick?: () => void;
  className?: string;
}

export function UserAvatar({ username, size, src, onClick, className }: Props) {
  const canUseWebp = useGlobalStore((state) => state.canUseWebp);

  // ensure hydration-safe SSR fallback
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  const imgSize = useMemo(
      () =>
          size === "xLarge" ? "large" : size === "normal" || size === "small" ? "small" : "medium",
      [size]
  );

  const imageSrc = useMemo(() => {
    // fallback to non-webp version until after hydration
    const format = hasMounted && canUseWebp ? "webp" : "match";

    return (
        proxifyImageSrc(src, 0, 0, format) ||
        `https://images.ecency.com${format === "webp" ? "/webp" : ""}/u/${username}/avatar/${imgSize}`
    );
  }, [src, imgSize, username, canUseWebp, hasMounted]);

  return (
      <span
          onClick={onClick}
          className={`user-avatar ${size ?? ""} ${className ?? ""}`}
          style={{ backgroundImage: `url(${imageSrc})` }}
      />
  );
}

export * from "./user-avatar-loading";
