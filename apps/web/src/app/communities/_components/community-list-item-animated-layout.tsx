import { PropsWithChildren } from "react";

export function CommunityListItemAnimatedLayout(props: PropsWithChildren<{ i: number }>) {
  return <div>{props.children}</div>;
}
