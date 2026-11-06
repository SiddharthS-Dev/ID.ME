import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../App";
import type { Role } from "../app/navigation";
import { SessionProvider } from "../app/session";

/** Renders the real route tree (in StrictMode, like the app) at a URL with an isolated query cache. */
export function renderAt(path: string, roles: readonly Role[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return {
    router,
    ...render(
      <StrictMode>
        <QueryClientProvider client={client}>
          <SessionProvider value={{ roles }}>
            <RouterProvider router={router} />
          </SessionProvider>
        </QueryClientProvider>
      </StrictMode>,
    ),
  };
}
