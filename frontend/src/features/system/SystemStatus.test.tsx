import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SystemStatus } from "./SystemStatus";

function renderStatus() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SystemStatus />
    </QueryClientProvider>,
  );
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("SystemStatus", () => {
  it("shows a loading state while checking", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise<Response>(() => {}));
    renderStatus();
    expect(screen.getByText("Checking API…")).toBeInTheDocument();
  });

  it("shows live values returned by the API", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) =>
      String(input).includes("health")
        ? json({ status: "UP" })
        : json({ product: "ID.Me", apiVersion: "v1", buildVersion: "0.1.0-SNAPSHOT", environment: "local", demoDataEnabled: false, serverTime: "2026-11-06T11:24:57Z" }),
    );
    renderStatus();
    expect(await screen.findByText("Connected · v1")).toBeInTheDocument();
    expect(await screen.findByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText(/0\.1\.0-SNAPSHOT/)).toBeInTheDocument();
    expect(screen.getByText(/Disabled\. Everything shown comes from recorded data/)).toBeInTheDocument();
  });

  it("shows an error state when the API is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    renderStatus();
    expect(await screen.findByText("Unreachable")).toBeInTheDocument();
    expect(await screen.findByText("Health check failed")).toBeInTheDocument();
  });
});
