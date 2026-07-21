import { describe, expect, it } from "vitest";
import {
  IMAGE_UPLOAD_ACCEPT,
  isAcceptedImageFile,
  isAcceptedImageFilename
} from "@/utils/image-upload-formats";

describe("image upload formats", () => {
  it("accepts every format the image server stores", () => {
    ["photo.jpg", "photo.jpeg", "photo.png", "photo.gif", "photo.webp", "photo.avif", "logo.svg", "photo.heic", "photo.heif"].forEach(
      (name) => expect(isAcceptedImageFilename(name)).toBe(true)
    );
  });

  it("is case-insensitive", () => {
    expect(isAcceptedImageFilename("PHOTO.AVIF")).toBe(true);
  });

  it("rejects non-image files", () => {
    expect(isAcceptedImageFilename("notes.txt")).toBe(false);
    expect(isAcceptedImageFilename("clip.mp4")).toBe(false);
    expect(isAcceptedImageFilename("archive.avif.zip")).toBe(false);
  });

  it("accepts a file by mime type when the name has no extension", () => {
    expect(isAcceptedImageFile(new File([""], "pasted", { type: "image/avif" }))).toBe(true);
    expect(isAcceptedImageFile(new File([""], "pasted", { type: "text/plain" }))).toBe(false);
  });

  it("offers avif in the file input accept attribute", () => {
    expect(IMAGE_UPLOAD_ACCEPT).toContain("image/avif");
    expect(IMAGE_UPLOAD_ACCEPT).toContain(".avif");
  });
});
