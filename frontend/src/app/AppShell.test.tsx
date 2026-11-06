import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAt } from "../test/render";

describe("workspace shell", () => {
  beforeEach(() => {
    // The overview requests live status; keep it pending so the shell is tested in isolation.
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise<Response>(() => {}));
  });

  it("offers a skip link to the main content", () => {
    renderAt("/app");
    const skip = screen.getByRole("link", { name: "Skip to main content" });
    expect(skip).toHaveAttribute("href", "#main");
    expect(document.getElementById("main")).toBeInTheDocument();
  });

  it("renders the primary navigation without Administration for an anonymous preview session", () => {
    renderAt("/app");
    const nav = screen.getAllByRole("navigation", { name: "Primary" })[0]!;
    const links = within(nav).getAllByRole("link").map((l) => l.textContent);
    expect(links).toContain("My Cards");
    expect(links).toContain("API Usage & Costs");
    expect(links).not.toContain("Administration");
  });

  it("marks the current page in the navigation", () => {
    renderAt("/app/contacts");
    const nav = screen.getAllByRole("navigation", { name: "Primary" })[0]!;
    expect(within(nav).getByRole("link", { name: "Contacts" })).toHaveAttribute("aria-current", "page");
  });

  it("shows an honest planned state instead of sample data for unbuilt modules", () => {
    renderAt("/app/leads");
    expect(screen.getByRole("heading", { level: 1, name: "Leads" })).toBeInTheDocument();
    expect(screen.getByText("Leads is not available yet")).toBeInTheDocument();
    expect(screen.getByText(/UC-15/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("opens the mobile navigation drawer, closes it with Escape and returns focus", async () => {
    const user = userEvent.setup();
    renderAt("/app");
    const menu = screen.getByRole("button", { name: "Open navigation" });
    expect(menu).toHaveAttribute("aria-expanded", "false");

    await user.click(menu);
    const dialog = screen.getByRole("dialog", { name: "Navigation" });
    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(menu).toHaveFocus();
  });

  it("never links to Administration anywhere on the page for an anonymous session", () => {
    renderAt("/app");
    expect(screen.queryAllByRole("link", { name: "Administration" })).toHaveLength(0);
  });

  it("shows Administration to an organization administrator", () => {
    renderAt("/app", ["ORG_ADMIN"]);
    expect(screen.getAllByRole("link", { name: "Administration" }).length).toBeGreaterThan(0);
  });

  it("does not steal focus on initial load, but focuses the new heading after navigation", async () => {
    const { router } = renderAt("/app");
    expect(document.activeElement).toBe(document.body);
    await router.navigate("/app/team");
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Team" })).toHaveFocus());
  });

  it("renders a not-found page for unknown workspace routes", () => {
    renderAt("/app/does-not-exist");
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});
