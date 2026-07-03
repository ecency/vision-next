import { PropsWithChildren } from "react";

export function CommunityCardAnimated({
  i,
  className,
  children
}: PropsWithChildren<{ i: number; className?: string }>) {
  return <article className={className}>{children}</article>;
}

export default CommunityCardAnimated;
