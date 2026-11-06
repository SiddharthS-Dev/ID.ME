import { AlertTriangle, CheckCircle2, CircleDashed, Loader2, XCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight text-ink outline-none sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 max-w-3xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`surface-card p-5 ${className}`} aria-label={title}>
      {title && <h2 className="mb-3 text-base font-semibold text-ink">{title}</h2>}
      {children}
    </section>
  );
}

export type Status = "ok" | "degraded" | "down" | "unknown" | "planned";

const STATUS_STYLE: Record<Status, { icon: LucideIcon; className: string; label: string }> = {
  ok: { icon: CheckCircle2, className: "border-success-400/40 bg-success-400/10 text-success-400", label: "Operational" },
  degraded: { icon: AlertTriangle, className: "border-warning-400/40 bg-warning-400/10 text-warning-400", label: "Degraded" },
  down: { icon: XCircle, className: "border-danger-400/40 bg-danger-400/10 text-danger-400", label: "Unavailable" },
  unknown: { icon: CircleDashed, className: "border-line bg-navy-700 text-muted", label: "Unknown" },
  planned: { icon: CircleDashed, className: "border-brand-400/40 bg-brand-500/10 text-brand-300", label: "Planned" },
};

/** Status is always conveyed by text and icon, never by colour alone. */
export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const style = STATUS_STYLE[status];
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium ${style.className}`}>
      <Icon aria-hidden="true" className="size-4" />
      {label ?? style.label}
    </span>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-muted">
      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      {label}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="surface-card flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-navy-700 text-accent-300">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-2 max-w-xl text-muted">{children}</div>
    </div>
  );
}

export function Alert({ tone = "info", title, children }: { tone?: "info" | "warning" | "danger"; title: string; children?: ReactNode }) {
  const tones = {
    info: "border-accent-400/40 bg-accent-400/10",
    warning: "border-warning-400/40 bg-warning-400/10",
    danger: "border-danger-400/40 bg-danger-400/10",
  } as const;
  return (
    <div role={tone === "danger" ? "alert" : "note"} className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}
