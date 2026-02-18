"use client";

import React, { useMemo } from "react";
import { proxifyImageSrc, setProxyBase } from "@ecency/render-helper";
import "./_index.scss";
import defaults from "@/defaults";

setProxyBase(defaults.imageServer);

interface Props {
  username: string;
  size?: string;
  src?: string;
  onClick?: () => void;
  className?: string;
}

export function UserAvatar({ username, size, src, onClick, className }: Props) {
  const imgSize = useMemo(() => {
    switch (size) {
      case "xLarge":
        return "large";
      case "normal":
      case "small":
        return "small";
      case "sLarge":
      case "medium":
        return "medium";
      case "large":
        return "large";
      case "xsmall":
        return "small";
      case "deck-item":
        return "small";
      default:
        return "medium";
    }
  }, [size]);

  const imageSrc = useMemo(() => {
    return (
        proxifyImageSrc(src) ||
        `${defaults.imageServer}/u/${username}/avatar/${imgSize}`
    );
  }, [src, imgSize, username]);

  return (
      <span
          onClick={onClick}
          className={`user-avatar ${size ?? ""} ${className ?? ""}`}
          style={{ backgroundImage: `url(${imageSrc})` }}
      />
  );
}

interface PropsL {
  size?: string;
  className?: string;
}

export function UserAvatarLoading({ size, className }: PropsL) {
  return (
      <span
          className={`user-avatar animate-pulse  bg-blue-dark-sky-040 dark:bg-blue-dark-grey ${size} ${className}`}
      />
  );
}
