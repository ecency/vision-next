import { queryClient } from "@/consts/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { FloatingMenu } from "@/features/floating-menu";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <Outlet />
      <FloatingMenu show={true} />
    </QueryClientProvider>
  );
}
