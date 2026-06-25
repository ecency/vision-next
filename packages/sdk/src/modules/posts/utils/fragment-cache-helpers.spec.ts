import { describe, it, expect } from "vitest";
import { applyFragmentUpdate, buildAddedFragment } from "./fragment-cache-helpers";
import { Fragment } from "../types";

const existing: Fragment = {
  id: "frag-1",
  title: "Old title",
  body: "Old body",
  created: "2026-01-01T00:00:00Z",
  modified: "2026-01-01T00:00:00Z"
};

describe("applyFragmentUpdate", () => {
  // Regression: /fragments-update returns a minimal ack (no title/body), which
  // used to be written straight into the cache and blanked out the snippet.
  it("keeps the submitted title/body when the response is blank", () => {
    const result = applyFragmentUpdate(existing, {} as Partial<Fragment>, {
      title: "New title",
      body: "New body"
    });

    expect(result.title).toBe("New title");
    expect(result.body).toBe("New body");
    // Identity/created are preserved from the existing record.
    expect(result.id).toBe("frag-1");
    expect(result.created).toBe("2026-01-01T00:00:00Z");
  });

  it("tolerates a null/undefined response", () => {
    expect(applyFragmentUpdate(existing, null, { title: "A", body: "B" })).toMatchObject({
      id: "frag-1",
      title: "A",
      body: "B"
    });
    expect(applyFragmentUpdate(existing, undefined, { title: "A", body: "B" })).toMatchObject({
      id: "frag-1",
      title: "A",
      body: "B"
    });
  });

  it("prefers submitted title/body over a stale response, but keeps other response fields", () => {
    const result = applyFragmentUpdate(
      existing,
      { title: "stale", body: "stale", modified: "2026-06-25T00:00:00Z" },
      { title: "New title", body: "New body" }
    );

    expect(result.title).toBe("New title");
    expect(result.body).toBe("New body");
    expect(result.modified).toBe("2026-06-25T00:00:00Z");
  });
});

describe("buildAddedFragment", () => {
  it("reaffirms the submitted title/body while keeping the server id", () => {
    const response: Fragment = {
      id: "frag-new",
      title: "",
      body: "",
      created: "2026-06-25T00:00:00Z",
      modified: "2026-06-25T00:00:00Z"
    };

    const result = buildAddedFragment(response, { title: "Hello", body: "World" });

    expect(result.id).toBe("frag-new");
    expect(result.title).toBe("Hello");
    expect(result.body).toBe("World");
  });

  it("tolerates a null/undefined response without throwing", () => {
    expect(buildAddedFragment(null, { title: "Hello", body: "World" })).toMatchObject({
      title: "Hello",
      body: "World"
    });
    expect(buildAddedFragment(undefined, { title: "Hello", body: "World" })).toMatchObject({
      title: "Hello",
      body: "World"
    });
  });
});
