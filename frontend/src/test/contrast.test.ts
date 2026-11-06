import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Reads the real design tokens from styles.css so the contrast claims there stay verified.
const css = readFileSync(resolve(__dirname, "../styles.css"), "utf8");
const token = (name: string): string => {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`Token --color-${name} not found`);
  return match[1];
};

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe("design token contrast (WCAG 2.2 AA)", () => {
  const surfaces = ["navy-950", "navy-900", "navy-800", "navy-700"];

  it.each(surfaces)("body and muted text meet 4.5:1 on %s", (surface) => {
    expect(contrast(token("ink"), token(surface))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("muted"), token(surface))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["accent-300", "brand-300", "success-400", "warning-400", "danger-400"])("status/accent text %s meets 4.5:1 on navy-800", (fg) => {
    expect(contrast(token(fg), token("navy-800"))).toBeGreaterThanOrEqual(4.5);
  });

  it("focus ring (accent-300) meets 3:1 non-text contrast on every surface", () => {
    for (const s of surfaces) expect(contrast(token("accent-300"), token(s))).toBeGreaterThanOrEqual(3);
  });

  it("white text on the primary button (brand-600) meets 4.5:1", () => {
    expect(contrast("#ffffff", token("brand-600"))).toBeGreaterThanOrEqual(4.5);
  });

  it("skip link text (navy-950 on accent-300) meets 4.5:1", () => {
    expect(contrast(token("navy-950"), token("accent-300"))).toBeGreaterThanOrEqual(4.5);
  });

  it("subtle text is reserved for large/non-essential text (>= 3:1)", () => {
    expect(contrast(token("subtle"), token("navy-800"))).toBeGreaterThanOrEqual(3);
  });
});
