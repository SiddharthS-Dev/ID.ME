import { describe, expect, it } from "vitest";
import { NAV_ITEMS, visibleNavItems } from "./navigation";

describe("navigation model", () => {
  it("contains the core navigation in the specified order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Overview",
      "My Cards",
      "Contacts",
      "Leads",
      "Activities & Follow-ups",
      "Campaigns & Events",
      "Team",
      "Analytics",
      "Integrations",
      "API Usage & Costs",
      "Settings",
      "Administration",
    ]);
  });

  it("hides Administration from sessions without an administrative role", () => {
    expect(visibleNavItems([]).some((i) => i.id === "admin")).toBe(false);
    expect(visibleNavItems(["INDIVIDUAL"]).some((i) => i.id === "admin")).toBe(false);
    expect(visibleNavItems(["ORG_MEMBER"]).some((i) => i.id === "admin")).toBe(false);
  });

  it.each(["ORG_ADMIN", "ORG_OWNER", "PLATFORM_ADMIN"] as const)("shows Administration to %s", (role) => {
    expect(visibleNavItems([role]).some((i) => i.id === "admin")).toBe(true);
  });

  it("links every module to at least one requirement and a delivery phase", () => {
    for (const item of NAV_ITEMS) {
      expect(item.requirements.length).toBeGreaterThan(0);
      expect(item.phase).toBeGreaterThanOrEqual(1);
    }
  });
});
