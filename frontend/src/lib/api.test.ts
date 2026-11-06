import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet, apiRequest, readCookie } from "./api";

function jsonResponse(body: unknown, status = 200, contentType = "application/json") {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": contentType } });
}

describe("api client", () => {
  afterEach(() => {
    document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("returns parsed JSON and sends same-origin credentials", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ product: "ID.Me" }));
    await expect(apiGet<{ product: string }>("/api/v1/meta")).resolves.toEqual({ product: "ID.Me" });
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("same-origin");
  });

  it("converts RFC 9457 problem documents into ApiError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ status: 401, title: "Unauthorized", detail: "Authentication is required to access this resource." }, 401, "application/problem+json"),
    );
    const error = await apiGet("/api/v1/contacts").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect((error as ApiError).message).toBe("Authentication is required to access this resource.");
  });

  it("reports network failures as status 0 without leaking internals", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const error = (await apiGet("/api/v1/meta").catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/could not be reached/);
  });

  it("echoes the CSRF cookie on state-changing requests only", async () => {
    document.cookie = "XSRF-TOKEN=abc123; path=/";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(null, { status: 204 }));
    await apiRequest("/api/v1/things", { method: "POST", body: "{}" });
    await apiRequest("/api/v1/things");
    const postHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    const getHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers);
    expect(postHeaders.get("X-XSRF-TOKEN")).toBe("abc123");
    expect(getHeaders.has("X-XSRF-TOKEN")).toBe(false);
  });

  it("reads URL-encoded cookie values", () => {
    expect(readCookie("b", "a=1; b=x%3Dy; c=3")).toBe("x=y");
    expect(readCookie("missing", "a=1")).toBeUndefined();
  });
});
