import { PropsWithChildren } from "react";
import { BlogPage } from "./blog-page";
import { BlogSidebar } from "./blog-sidebar";
import { BlogNavigation } from "./blog-navigation";
import { InstanceConfigManager } from "@/core";
import clsx from "clsx";

export function BlogLayout(props: PropsWithChildren) {
  const sidebarPlacement = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.instanceConfiguration.layout.sidebar.placement
  );

  const isLeftSidebar = sidebarPlacement === "left";

  return (
    <div className="min-h-screen bg-theme-primary">
      <div className="container mx-auto px-4 sm:px-5">
        {/* Mobile/Tablet: Single column with sidebar on top */}
        <div
          className={clsx(
            "flex flex-col lg:grid lg:gap-12",
            isLeftSidebar ? "lg:grid-cols-[300px_1fr]" : "lg:grid-cols-[1fr_300px]"
          )}
        >
          {/* Sidebar - appears first on mobile/tablet */}
          <div
            className={clsx(
              "order-1",
              isLeftSidebar ? "lg:order-1" : "lg:order-2"
            )}
          >
            <BlogSidebar />
          </div>

          {/* Main content - appears second on mobile/tablet */}
          <div
            className={clsx(
              "order-2 items-start mt-4 sm:mt-8",
              isLeftSidebar ? "lg:order-2" : "lg:order-1"
            )}
          >
            <BlogNavigation />
            <BlogPage>{props.children}</BlogPage>
          </div>
        </div>
      </div>
    </div>
  );
}
