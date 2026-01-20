import type { PropsWithChildren } from 'react';
import { BlogNavigation } from './blog-navigation';
import { BlogPage } from './blog-page';
import { BlogSidebar } from './blog-sidebar';

export function BlogLayout(props: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-theme-primary">
      <div className="container mx-auto container-padding-theme">
        {/* Mobile/Tablet: Single column with sidebar on top */}
        <div className="blog-layout-grid flex flex-col lg:grid layout-gap-theme">
          {/* Sidebar - appears first on mobile/tablet */}
          <div className="blog-sidebar-container order-1">
            <BlogSidebar />
          </div>

          {/* Main content - appears second on mobile/tablet */}
          <main id="main-content" className="blog-main-container order-2 items-start mt-4 sm:mt-8 section-gap-theme">
            <BlogNavigation />
            <BlogPage>{props.children}</BlogPage>
          </main>
        </div>
      </div>
    </div>
  );
}
