import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router";
import { AppShell } from "./app/AppShell";
import { NAV_ITEMS } from "./app/navigation";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PlannedModulePage } from "./pages/PlannedModulePage";
import { PublicHomePage } from "./pages/PublicHomePage";
import { SessionProvider, type SessionView } from "./app/session";

const ANONYMOUS: SessionView = { roles: [] };

export const routes: RouteObject[] = [
  { path: "/", element: <PublicHomePage /> },
  {
    path: "/app",
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      ...NAV_ITEMS.filter((item) => item.id !== "overview").map((item) => ({
        path: item.path.replace("/app/", ""),
        element: <PlannedModulePage moduleId={item.id} />,
      })),
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
];

export function App() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }),
  );
  const [router] = useState(() => createBrowserRouter(routes));
  // Phase 0 has no authentication: the session view is anonymous. Phase 1 loads it from GET /api/v1/session.
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider value={ANONYMOUS}>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>
  );
}
