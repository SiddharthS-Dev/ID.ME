import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SERIOUS = ["serious", "critical"];

test.describe("Phase 0 walking skeleton", () => {
  test("public home page links to the workspace and makes no unverified claims", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/\d+\s*[x×]\s*more|\d+%\s*higher/i)).toHaveCount(0);
    await page.getByRole("link", { name: /open the workspace preview/i }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  });

  test("system status shows the live backend connection", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByText("Connected · v1")).toBeVisible();
    await expect(page.getByText("Healthy")).toBeVisible();
    await expect(page.getByText(/Disabled\. Everything shown comes from recorded data/)).toBeVisible();
  });

  test("keyboard users can skip to main content", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("every planned module shows an honest unavailable state", async ({ page, isMobile }) => {
    await page.goto("/app");
    for (const label of ["My Cards", "Contacts", "Leads", "Activities & Follow-ups", "Campaigns & Events", "Team", "Analytics", "Integrations", "API Usage & Costs", "Settings"]) {
      if (isMobile) await page.getByRole("button", { name: "Open navigation" }).click();
      const scope = isMobile ? page.getByRole("dialog", { name: "Navigation" }) : page.locator("aside");
      await scope.getByRole("link", { name: label, exact: true }).click();
      await expect(page.getByRole("heading", { level: 1, name: label })).toBeVisible();
      await expect(page.getByText(`${label} is not available yet`)).toBeVisible();
    }
  });

  test("protected API answers 401 problem+json through the same-origin proxy", async ({ request }) => {
    const response = await request.get("/api/v1/contacts");
    expect(response.status()).toBe(401);
    expect(response.headers()["content-type"]).toContain("application/problem+json");
  });

  for (const path of ["/", "/app", "/app/contacts"]) {
    test(`no serious or critical axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const blocking = results.violations.filter((v) => SERIOUS.includes(v.impact ?? ""));
      expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  }

  test("no horizontal page scroll at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    for (const path of ["/", "/app", "/app/usage"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
