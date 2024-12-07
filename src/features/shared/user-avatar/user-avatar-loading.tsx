import React from "react";

interface Props {
  size?: string;
  className?: string;
}

export function UserAvatarLoading({ size, className }: Props) {
  return (
    <span
      className={`user-avatar animate-pulse  bg-blue-dark-sky-040 dark:bg-blue-dark-grey ${size} ${className}`}
    />
  );
}
