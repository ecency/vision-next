import { PropsWithChildren } from "react";
import { BlogPage } from "./blog-page";
import { BlogSidebar } from "./blog-sidebar";
import { BlogNavigation } from "./blog-navigation";

export function BlogLayout(props: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-5">
        {/* Mobile/Tablet: Single column with sidebar on top */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
          {/* Sidebar - appears first on mobile/tablet, second on desktop */}
          <div className="order-1 lg:order-2">
            <BlogSidebar />
          </div>
          
          {/* Main content - appears second on mobile/tablet, first on desktop */}
          <div className="order-2 lg:order-1 items-start mt-4 sm:mt-8">
            <BlogNavigation />
            <BlogPage>{props.children}</BlogPage>
          </div>
        </div>
      </div>
    </div>
  );
}
