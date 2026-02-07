import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { queryClient } from "@/consts/react-query";
import { FloatingMenu } from "@/features/floating-menu";
import { AuthProvider, useIsBlogOwner } from "@/features/auth";
import { ErrorBoundary, SkipToContent } from "@/features/shared";
import {
  clearHiveAuthSession,
  clearUser,
  getHiveAuthSession,
  getUser,
} from "@/features/auth/storage";
import { authenticationStore } from "@/store";

// Check if we're in development mode
const isDev = process.env.NODE_ENV === "development";

// Only load devtools in development
const ReactQueryDevtools = isDev
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((mod) => ({
        default: mod.ReactQueryDevtools,
      }))
    )
  : () => null;

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: () => {
    const storedUser = getUser();
    const storedHiveAuth = getHiveAuthSession();

    if (storedUser) {
      // Check if token has expired
      if (storedUser.expiresAt && Date.now() > storedUser.expiresAt) {
        // Token expired, clear session
        clearUser();
        clearHiveAuthSession();
      } else {
        authenticationStore.getState().setUser(storedUser);
      }
    }
    if (storedHiveAuth) {
      // Check if HiveAuth session has expired
      if (Date.now() > storedHiveAuth.expire * 1000) {
        clearHiveAuthSession();
      } else {
        authenticationStore.getState().setSession(storedHiveAuth);
      }
    }
  },
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      {isDev && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
      <SkipToContent />
      <ErrorBoundary>
        <AuthProvider>
          <Outlet />
          <AuthorizedFloatingMenu />
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

// Show FloatingMenu for blog owner or in development mode
function AuthorizedFloatingMenu() {
  const isBlogOwner = useIsBlogOwner();
  const isDevelopment = process.env.NODE_ENV === "development";

  // Show in dev mode for testing, or when authenticated as blog owner
  if (!isDevelopment && !isBlogOwner) {
    return null;
  }

  return <FloatingMenu show={true} />;
}
