import { describe, expect, it } from "vitest";
import { extForImageType } from "@/utils/image-file-ext";

describe("extForImageType", () => {
  it("maps known image mime types to extensions", () => {
    expect(extForImageType("image/png")).toBe("png");
    expect(extForImageType("image/jpeg")).toBe("jpg");
    expect(extForImageType("image/jpg")).toBe("jpg");
    expect(extForImageType("image/gif")).toBe("gif");
    expect(extForImageType("image/webp")).toBe("webp");
    expect(extForImageType("image/avif")).toBe("avif");
  });

  it("is case-insensitive", () => {
    expect(extForImageType("IMAGE/PNG")).toBe("png");
  });

  it("falls back to png for unknown, empty or missing types", () => {
    expect(extForImageType("application/octet-stream")).toBe("png");
    expect(extForImageType("")).toBe("png");
    expect(extForImageType(undefined)).toBe("png");
    expect(extForImageType(null)).toBe("png");
  });
});
