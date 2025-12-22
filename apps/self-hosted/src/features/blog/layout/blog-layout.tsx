import { PropsWithChildren } from "react";
import { BlogPage } from "./blog-page";
import { BlogSidebar } from "./blog-sidebar";
import { BlogNavigation } from "./blog-navigation";

export function BlogLayout(props: PropsWithChildren) {
  return (
    <div className="px-2 container mx-auto grid grid-cols-[1fr_300px] items-start gap-4">
      <BlogNavigation />
      <BlogPage>{props.children}</BlogPage>
      <BlogSidebar />
    </div>
  );
}
