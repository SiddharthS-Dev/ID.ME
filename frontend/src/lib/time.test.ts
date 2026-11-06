import { describe, expect, it } from "vitest";
import { formatDateTime } from "./time";

describe("formatDateTime", () => {
  const instant = "2026-11-06T11:24:57Z";

  it("renders the same instant in the requested timezone", () => {
    expect(formatDateTime(instant, "Asia/Kolkata", "en-GB")).toContain("16:54:57");
    expect(formatDateTime(instant, "UTC", "en-GB")).toContain("11:24:57");
  });

  it("always includes a timezone label", () => {
    expect(formatDateTime(instant, "UTC", "en-GB")).toMatch(/UTC/);
  });

  it("handles invalid input without throwing", () => {
    expect(formatDateTime("not-a-date", "UTC")).toBe("Invalid date");
  });
});
