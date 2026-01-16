import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { queryClient } from '@/consts/react-query';
import { FloatingMenu } from '@/features/floating-menu';
import { AuthProvider, useIsBlogOwner } from '@/features/auth';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <AuthProvider>
        <Outlet />
        <AuthorizedFloatingMenu />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Only show FloatingMenu for blog owner
function AuthorizedFloatingMenu() {
  const isBlogOwner = useIsBlogOwner();

  if (!isBlogOwner) {
    return null;
  }

  return <FloatingMenu show={true} />;
}
