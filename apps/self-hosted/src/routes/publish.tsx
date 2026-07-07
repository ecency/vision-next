import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  usePublishEditor,
  PublishEditor,
  PublishActionBar,
} from "@/features/publish";
import { useIsBlogOwner, useIsAuthEnabled, useIsAuthenticated } from "@/features/auth/hooks";
import { useInstanceConfig } from "@/features/blog/hooks/use-instance-config";
import { BlogSidebar } from "@/features/blog/layout/blog-sidebar";
import { useEffect } from "react";

export const Route = createFileRoute("/publish")({
  component: RouteComponent
});

function RouteComponent() {
  const isBlogOwner = useIsBlogOwner();
  const isAuthEnabled = useIsAuthEnabled();
  const isAuthenticated = useIsAuthenticated();
  const { isCommunityMode } = useInstanceConfig();
  const navigate = useNavigate();

  // Community instances: any authenticated user can compose (posts publish into the community).
  // Blog instances: only the instance owner. Redirect anyone who does not qualify.
  const canPublish = isAuthEnabled && (isCommunityMode ? isAuthenticated : isBlogOwner);

  useEffect(() => {
    if (!canPublish) {
      navigate({ to: "/blog", search: { filter: "posts" } });
    }
  }, [canPublish, navigate]);

  if (!canPublish) {
    return null;
  }

  return <PublishPageContent />;
}

function PublishPageContent() {
  const { editor } = usePublishEditor();

  return (
    <div className="min-h-screen bg-theme-primary">
      <div className="container mx-auto container-padding-theme">
        <div className="blog-layout-grid flex flex-col lg:grid layout-gap-theme">
          {/* Main content - appears first on mobile/tablet */}
          <main className="blog-main-container order-2 lg:order-1 items-start mt-4 sm:mt-8 section-gap-theme">
            <PublishActionBar />
            <div className="max-w-[1024px] w-full mx-auto px-2 md:px-4 py-4">
              <PublishEditor editor={editor} />
            </div>
          </main>

          {/* Sidebar - appears second on mobile/tablet, right on desktop */}
          <div className="blog-sidebar-container order-1 lg:order-2">
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
