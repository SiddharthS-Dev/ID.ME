import {
  Activity,
  BarChart3,
  CalendarRange,
  Coins,
  Contact,
  CreditCard,
  LayoutDashboard,
  Plug,
  Settings,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Role names mirror docs/permissions.md. The backend remains the authority for every permission. */
export type Role = "INDIVIDUAL" | "ORG_MEMBER" | "ORG_ADMIN" | "ORG_OWNER" | "PLATFORM_ADMIN";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  /** Delivery phase in which the module becomes functional (docs/project-status.md). */
  phase: number;
  summary: string;
  requirements: string[];
  /** When set, the item is shown only to sessions holding one of these roles. */
  requiresAnyRole?: Role[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    path: "/app",
    icon: LayoutDashboard,
    phase: 6,
    summary: "Your networking summary: cards, exchanges, open follow-ups and conversion, from recorded data only.",
    requirements: ["UC-36", "IDM-REQ-040"],
  },
  {
    id: "cards",
    label: "My Cards",
    path: "/app/cards",
    icon: CreditCard,
    phase: 2,
    summary: "Create, preview, publish, unpublish and share digital business cards by link, QR code or NFC.",
    requirements: ["UC-02", "UC-05", "UC-06", "UC-07", "UC-09"],
  },
  {
    id: "contacts",
    label: "Contacts",
    path: "/app/contacts",
    icon: Contact,
    phase: 3,
    summary: "Contacts captured with provenance and explicit sharing preferences, duplicate review and export.",
    requirements: ["UC-08", "UC-10", "UC-11", "UC-12", "UC-38"],
  },
  {
    id: "leads",
    label: "Leads",
    path: "/app/leads",
    icon: Target,
    phase: 3,
    summary: "Lead stages, ownership, next actions and outcomes. Scoring arrives later and is always explainable.",
    requirements: ["UC-11", "UC-14", "UC-15"],
  },
  {
    id: "activities",
    label: "Activities & Follow-ups",
    path: "/app/activities",
    icon: Activity,
    phase: 4,
    summary: "Follow-up tasks with owners and due dates, reminders, escalation and consent-aware email.",
    requirements: ["UC-16", "UC-17", "UC-19"],
  },
  {
    id: "campaigns",
    label: "Campaigns & Events",
    path: "/app/campaigns",
    icon: CalendarRange,
    phase: 7,
    summary: "Event workspaces, badge and visitor capture, routing and permitted campaign follow-up.",
    requirements: ["UC-21", "UC-22", "UC-23", "UC-24", "UC-25"],
  },
  {
    id: "team",
    label: "Team",
    path: "/app/team",
    icon: Users,
    phase: 5,
    summary: "Members, roles, departments, branded templates, bulk provisioning and offboarding.",
    requirements: ["UC-04", "UC-27", "UC-28", "UC-29"],
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/app/analytics",
    icon: BarChart3,
    phase: 6,
    summary: "Funnel and attribution reporting with metric definitions and an explicit unknown bucket.",
    requirements: ["UC-36", "UC-37"],
  },
  {
    id: "integrations",
    label: "Integrations",
    path: "/app/integrations",
    icon: Plug,
    phase: 8,
    summary: "Optional provider connections (CRM, calendar, email, messaging, media) with clear health states.",
    requirements: ["UC-31", "UC-32", "UC-33", "UC-35", "IDM-REQ-060"],
  },
  {
    id: "usage",
    label: "API Usage & Costs",
    path: "/app/usage",
    icon: Coins,
    phase: 6,
    summary: "Provider usage, estimated versus invoiced cost, budgets, alerts and feature limits.",
    requirements: ["IDM-REQ-070", "IDM-REQ-071", "IDM-REQ-072"],
  },
  {
    id: "settings",
    label: "Settings",
    path: "/app/settings",
    icon: Settings,
    phase: 1,
    summary: "Profile, timezone, notification and privacy preferences, sessions and data export.",
    requirements: ["UC-01", "IDM-REQ-041"],
  },
  {
    id: "admin",
    label: "Administration",
    path: "/app/admin",
    icon: ShieldCheck,
    phase: 1,
    summary: "Organization or platform administration, audit log review and audited support access.",
    requirements: ["UC-26", "UC-28", "UC-39"],
    requiresAnyRole: ["ORG_ADMIN", "ORG_OWNER", "PLATFORM_ADMIN"],
  },
];

export function visibleNavItems(roles: readonly Role[], items: readonly NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => !item.requiresAnyRole || item.requiresAnyRole.some((role) => roles.includes(role)));
}

export function findNavItem(id: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id);
}
