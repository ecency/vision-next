import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  usePublishEditor,
  PublishEditor,
  PublishActionBar,
} from "@/features/publish";
import { useIsBlogOwner, useIsAuthEnabled } from "@/features/auth/hooks";
import { BlogSidebar } from "@/features/blog/layout/blog-sidebar";
import { useEffect } from "react";

export const Route = createFileRoute("/publish")({
  component: RouteComponent
});

function RouteComponent() {
  const isBlogOwner = useIsBlogOwner();
  const isAuthEnabled = useIsAuthEnabled();
  const navigate = useNavigate();

  // Redirect if auth is disabled or user is not blog owner
  useEffect(() => {
    if (!isAuthEnabled || !isBlogOwner) {
      navigate({ to: "/blog", search: { filter: "posts" } });
    }
  }, [isAuthEnabled, isBlogOwner, navigate]);

  if (!isAuthEnabled || !isBlogOwner) {
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
