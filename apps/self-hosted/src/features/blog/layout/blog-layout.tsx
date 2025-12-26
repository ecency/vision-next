import { PropsWithChildren } from "react";
import { BlogPage } from "./blog-page";
import { BlogSidebar } from "./blog-sidebar";
import { BlogNavigation } from "./blog-navigation";

export function BlogLayout(props: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto gap-12 px-5 grid grid-cols-[1fr_300px]">
        <div className="items-start mt-8">
          <BlogNavigation />
          <BlogPage>{props.children}</BlogPage>
        </div>
        <BlogSidebar />
      </div>
    </div>
  );
}
