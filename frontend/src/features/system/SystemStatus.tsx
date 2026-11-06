import { useQuery } from "@tanstack/react-query";
import { apiGet, ApiError } from "../../lib/api";
import { browserTimeZone, formatDateTime } from "../../lib/time";
import { Card, Spinner, StatusBadge } from "../../components/ui";

interface Meta {
  product: string;
  apiVersion: string;
  buildVersion: string;
  environment: string;
  demoDataEnabled: boolean;
  serverTime: string;
}

interface Health {
  status: "UP" | "DOWN" | "OUT_OF_SERVICE" | "UNKNOWN";
}

/** Live service status from GET /api/v1/meta and GET /actuator/health. No values are hard-coded. */
export function SystemStatus() {
  const meta = useQuery({ queryKey: ["meta"], queryFn: () => apiGet<Meta>("/api/v1/meta") });
  const health = useQuery({ queryKey: ["health"], queryFn: () => apiGet<Health>("/actuator/health") });

  return (
    <Card title="System status">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted">API</dt>
          <dd className="mt-1">
            {meta.isPending ? (
              <Spinner label="Checking API…" />
            ) : meta.isError ? (
              <StatusBadge status="down" label={describeError(meta.error)} />
            ) : (
              <StatusBadge status="ok" label={`Connected · ${meta.data.apiVersion}`} />
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Database and service health</dt>
          <dd className="mt-1">
            {health.isPending ? (
              <Spinner label="Checking health…" />
            ) : health.isError ? (
              <StatusBadge status={health.error instanceof ApiError && health.error.status === 503 ? "degraded" : "down"} label="Health check failed" />
            ) : (
              <StatusBadge status={health.data.status === "UP" ? "ok" : "degraded"} label={health.data.status === "UP" ? "Healthy" : health.data.status} />
            )}
          </dd>
        </div>
        {meta.data && (
          <>
            <div>
              <dt className="text-sm text-muted">Build</dt>
              <dd className="mt-1 font-mono text-sm text-ink">
                {meta.data.buildVersion} · {meta.data.environment}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Server time ({browserTimeZone()})</dt>
              <dd className="mt-1 text-sm text-ink">
                <time dateTime={meta.data.serverTime}>{formatDateTime(meta.data.serverTime)}</time>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted">Demo data</dt>
              <dd className="mt-1 text-sm text-ink">
                {meta.data.demoDataEnabled ? "Synthetic demo data is enabled and labelled." : "Disabled. Everything shown comes from recorded data."}
              </dd>
            </div>
          </>
        )}
      </dl>
    </Card>
  );
}

function describeError(error: unknown): string {
  if (error instanceof ApiError && error.status === 0) return "Unreachable";
  if (error instanceof ApiError) return `Error ${error.status}`;
  return "Unavailable";
}
