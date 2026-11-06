/**
 * Minimal same-origin API client.
 * - Sends cookies (server-managed HttpOnly session) and never stores tokens in JS-accessible storage.
 * - Echoes the CSRF cookie in the X-XSRF-TOKEN header on state-changing requests.
 * - Turns RFC 9457 problem documents into typed ApiError instances.
 */

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetail;

  constructor(status: number, problem: ProblemDetail) {
    super(problem.detail ?? problem.title ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function readCookie(name: string, cookieSource: string = document.cookie): string | undefined {
  for (const part of cookieSource.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json, application/problem+json");
  if (UNSAFE_METHODS.has(method)) {
    const csrf = readCookie("XSRF-TOKEN");
    if (csrf) headers.set("X-XSRF-TOKEN", csrf);
  }

  let response: Response;
  try {
    response = await fetch(path, { ...init, method, headers, credentials: "same-origin" });
  } catch {
    throw new ApiError(0, { title: "Network error", detail: "The service could not be reached. Check your connection and try again." });
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const isJson = contentType.includes("json");

  if (!response.ok) {
    const problem: ProblemDetail = isJson ? await response.json().catch(() => ({})) : {};
    throw new ApiError(response.status, { status: response.status, ...problem });
  }
  if (response.status === 204 || !isJson) return undefined as T;
  return (await response.json()) as T;
}

export const apiGet = <T>(path: string) => apiRequest<T>(path);
