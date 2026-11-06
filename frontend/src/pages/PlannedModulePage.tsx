import { Construction } from "lucide-react";
import { findNavItem } from "../app/navigation";
import { EmptyState, PageHeader, StatusBadge } from "../components/ui";

/**
 * Honest placeholder for a module whose backend is not yet built. It never shows sample records,
 * so a screenshot of it cannot be mistaken for a working feature.
 */
export function PlannedModulePage({ moduleId }: { moduleId: string }) {
  const item = findNavItem(moduleId);
  if (!item) return null;
  return (
    <>
      <PageHeader title={item.label} description={item.summary} actions={<StatusBadge status="planned" label={`Planned · Phase ${item.phase}`} />} />
      <EmptyState icon={Construction} title={`${item.label} is not available yet`}>
        <p>
          This module is scheduled for Phase {item.phase}. It will be marked available only when its API, database records,
          permission checks and tests are complete.
        </p>
        <p className="mt-3 text-sm">
          Traceability: <span className="font-mono text-accent-300">{item.requirements.join(", ")}</span>
        </p>
      </EmptyState>
    </>
  );
}
