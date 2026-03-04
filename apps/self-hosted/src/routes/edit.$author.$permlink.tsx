import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getPostQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useIsBlogOwner, useIsAuthEnabled, useAuth } from "@/features/auth/hooks";
import { BlogSidebar } from "@/features/blog/layout/blog-sidebar";
import { useEffect, useMemo } from "react";
import { t } from "@/core";
import { EditPostEditor } from "@/features/publish/components/edit-post-editor";

export const Route = createFileRoute("/edit/$author/$permlink")({
  component: RouteComponent,
});

function RouteComponent() {
  const isBlogOwner = useIsBlogOwner();
  const isAuthEnabled = useIsAuthEnabled();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { author, permlink } = Route.useParams();

  const cleanAuthor = author.replace("@", "");
  const isAuthorOwner = isBlogOwner && user?.username === cleanAuthor;

  useEffect(() => {
    if (!isAuthEnabled || !isAuthorOwner) {
      navigate({ to: "/blog", search: { filter: "posts" } });
    }
  }, [isAuthEnabled, isAuthorOwner, navigate]);

  const queryOptions = getPostQueryOptions(cleanAuthor, permlink);
  const {
    data: entry,
    isLoading,
    error,
  } = useQuery({ ...queryOptions, enabled: isAuthorOwner });

  if (!isAuthEnabled || !isAuthorOwner) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-primary">
        <div className="container mx-auto container-padding-theme">
          <div className="text-center py-12 text-theme-muted">
            {t("loadingPost")}
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-theme-primary">
        <div className="container mx-auto container-padding-theme">
          <div className="text-center py-12 text-theme-muted">
            {t("postNotFound")}
          </div>
        </div>
      </div>
    );
  }

  return <EditPageContent entry={entry} />;
}

function EditPageContent({ entry }: { entry: any }) {
  const initialTags = useMemo(() => {
    const tags = entry.json_metadata?.tags;
    return Array.isArray(tags) ? tags : [];
  }, [entry]);

  const parentPermlink = useMemo(() => {
    return entry.parent_permlink || (initialTags[0] ?? "").toLowerCase();
  }, [entry, initialTags]);

  return (
    <div className="min-h-screen bg-theme-primary">
      <div className="container mx-auto container-padding-theme">
        <div className="blog-layout-grid flex flex-col lg:grid layout-gap-theme">
          <main className="blog-main-container order-2 lg:order-1 items-start mt-4 sm:mt-8 section-gap-theme">
            <EditPostEditor
              permlink={entry.permlink}
              parentPermlink={parentPermlink}
              initialTitle={entry.title}
              initialBody={entry.body}
              initialTags={initialTags}
            />
          </main>
          <div className="blog-sidebar-container order-1 lg:order-2">
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
