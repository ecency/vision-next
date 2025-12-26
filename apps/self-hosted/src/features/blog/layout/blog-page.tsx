import { PropsWithChildren } from "react";

export function BlogPage(props: PropsWithChildren) {
  return <div className="max-w-3xl mx-auto">{props.children}</div>;
}
