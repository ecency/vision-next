import { describe, it, expect } from "vitest";
import {
  columnPath,
  deltaPct,
  formatCompact,
  formatFull,
  hbarPath,
  scaleMax
} from "@/app/(staticPages)/creator-economy/_components/chart-utils";

describe("formatCompact", () => {
  it("formats millions, thousands and small numbers", () => {
    expect(formatCompact(1_709_252)).toBe("1.71M");
    expect(formatCompact(119_762)).toBe("120K");
    expect(formatCompact(5_144)).toBe("5.1K");
    expect(formatCompact(1_000)).toBe("1K");
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(98_966)).toBe("99K");
  });

  it("rounds the 999.5K boundary into the M branch (never '1000K')", () => {
    expect(formatCompact(999_600)).toBe("1M");
    expect(formatCompact(999_499)).toBe("999K");
  });
});

describe("formatFull", () => {
  it("adds thousands separators", () => {
    expect(formatFull(932211)).toBe("932,211");
  });
});

describe("deltaPct", () => {
  it("computes QoQ percent to one decimal", () => {
    expect(deltaPct(5144, 5853)).toBe(-12.1);
    expect(deltaPct(110, 100)).toBe(10);
  });

  it("returns null without a base", () => {
    expect(deltaPct(5144, null)).toBeNull();
    expect(deltaPct(5144, 0)).toBeNull();
    expect(deltaPct(5144, undefined)).toBeNull();
  });
});

describe("columnPath / hbarPath", () => {
  it("builds a rounded-top column with a square baseline", () => {
    const d = columnPath(10, 20, 24, 100, 4);
    expect(d.startsWith("M10,120")).toBe(true); // baseline at yTop+height
    expect(d).toContain("Q10,20 14,20"); // rounded top-left
    expect(d.endsWith("Z")).toBe(true);
  });

  it("degrades gracefully for tiny or zero bars", () => {
    expect(columnPath(0, 0, 24, 0)).toBe("");
    expect(columnPath(0, 0, 24, 2, 4)).not.toBe(""); // radius clamped to height
    expect(hbarPath(0, 0, 0, 14)).toBe("");
  });
});

describe("scaleMax", () => {
  it("adds headroom above the max and never returns 0", () => {
    expect(scaleMax([100, 50])).toBeCloseTo(112);
    expect(scaleMax([])).toBe(1);
    expect(scaleMax([0])).toBe(1);
  });
});
