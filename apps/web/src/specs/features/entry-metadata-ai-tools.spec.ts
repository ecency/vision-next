import { describe, expect, it } from "vitest";
import { EntryMetadataBuilder } from "@/features/entry-management/entry-metadata-manager/entry-metadata-builder";

// The AI-usage disclosure is optional and PeakD-compatible: only truthy flags are written,
// and the `ai_tools` object is omitted entirely when nothing was disclosed.
describe("EntryMetadataBuilder.withAiTools", () => {
  it("omits ai_tools when undefined", () => {
    const meta = new EntryMetadataBuilder().withAiTools(undefined).build();
    expect(meta.ai_tools).toBeUndefined();
  });

  it("omits ai_tools when the object is empty", () => {
    const meta = new EntryMetadataBuilder().withAiTools({}).build();
    expect(meta.ai_tools).toBeUndefined();
  });

  it("omits ai_tools when every flag is false", () => {
    const meta = new EntryMetadataBuilder()
      .withAiTools({ media_generation: false, writing_edit: false })
      .build();
    expect(meta.ai_tools).toBeUndefined();
  });

  it("writes only the truthy flags", () => {
    const meta = new EntryMetadataBuilder()
      .withAiTools({ media_generation: true, writing_edit: false })
      .build();
    expect(meta.ai_tools).toEqual({ media_generation: true });
  });

  it("writes both flags when both are disclosed", () => {
    const meta = new EntryMetadataBuilder()
      .withAiTools({ media_generation: true, writing_edit: true })
      .build();
    expect(meta.ai_tools).toEqual({ media_generation: true, writing_edit: true });
  });
});
