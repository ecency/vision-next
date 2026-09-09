import { describe, expect, test } from "vitest";
import { isBlankBody } from "@/utils/is-blank-body";

describe("isBlankBody", () => {
  test("treats nothing at all as blank", () => {
    expect(isBlankBody(undefined)).toBe(true);
    expect(isBlankBody(null)).toBe(true);
    expect(isBlankBody("")).toBe(true);
  });

  test("treats whitespace as blank", () => {
    expect(isBlankBody("   ")).toBe(true);
    expect(isBlankBody("\n\t  \r\n")).toBe(true);
    // NBSP and the ideographic space are whitespace, so trim() already got these.
    expect(isBlankBody(" 　")).toBe(true);
  });

  test("treats zero-width characters as blank, which trim() does not", () => {
    // The reason this helper exists: each of these survives String.trim(), so a
    // body made only of them used to pass every guard and get broadcast.
    expect("​".trim()).not.toBe("");
    expect(isBlankBody("​")).toBe(true); // zero width space
    expect(isBlankBody("‌‍")).toBe(true); // ZWNJ + ZWJ
    expect(isBlankBody("⁠")).toBe(true); // word joiner
    expect(isBlankBody("﻿")).toBe(true); // BOM
    expect(isBlankBody("­")).toBe(true); // soft hyphen
    expect(isBlankBody(" ​ ⁠ ")).toBe(true); // mixed with whitespace
  });

  test("keeps real content, including emoji built from ZWJ sequences", () => {
    expect(isBlankBody("hi")).toBe(false);
    expect(isBlankBody("  hi  ")).toBe(false);
    // The family emoji is joined by ZWJ. Stripping the joiner still leaves the
    // people, so it must not be mistaken for an empty body.
    expect(isBlankBody("\u{1f468}‍\u{1f469}‍\u{1f467}")).toBe(false);
    expect(isBlankBody("​ hello ​")).toBe(false);
  });
});
