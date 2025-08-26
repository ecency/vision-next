import React, { ReactNode } from "react";
import Link from "next/link";

export const makePathProfile = (username: string) => `/@${username}`;

interface Props {
  children: ReactNode;
  username: string;
  afterClick?: () => void;
  target?: string;
  className?: string;
}

export function ProfileLink({ afterClick, target, className, children, username }: Props) {
  const clicked = async (e: React.MouseEvent<HTMLElement>) => {
    if (afterClick) afterClick();
  };

  return (
    <Link
      href={makePathProfile(username)}
      target={target}
      className={className}
      onClick={typeof window !== "undefined" ? clicked : undefined}
    >
      {children}
    </Link>
  );
}

