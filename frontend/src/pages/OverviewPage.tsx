import { BarChart3 } from "lucide-react";
import { Link } from "react-router";
import { visibleNavItems } from "../app/navigation";
import { useSession } from "../app/session";
import { Card, EmptyState, PageHeader, StatusBadge } from "../components/ui";
import { SystemStatus } from "../features/system/SystemStatus";

export function OverviewPage() {
  const { roles } = useSession();
  const modules = visibleNavItems(roles)
    .filter((item) => item.id !== "overview")
    .sort((a, b) => a.phase - b.phase);
  return (
    <>
      <PageHeader
        title="Overview"
        description="Create → Connect → Capture → Qualify → Nurture → Convert → Measure. Metrics appear here only once real activity is recorded."
      />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <EmptyState icon={BarChart3} title="No networking activity yet">
            <p>
              Card views, exchanges, leads and follow-ups will be summarised here from recorded events once cards can be
              published (Phase 2) and analytics are delivered (Phase 6). Nothing on this page is sample data.
            </p>
          </EmptyState>
          <SystemStatus />
        </div>
        <Card title="Module delivery plan">
          <p className="mb-3 text-sm text-muted">From docs/project-status.md. A module is marked available only when its backend, data and tests exist.</p>
          <ul className="flex flex-col divide-y divide-line/60">
            {modules.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                <Link to={item.path} className="text-sm text-ink underline-offset-4 hover:underline">
                  {item.label}
                </Link>
                <StatusBadge status="planned" label={`Phase ${item.phase}`} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
