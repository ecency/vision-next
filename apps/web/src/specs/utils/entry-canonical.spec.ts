import { entryInstance1 } from "../test-helper";
import { entryCanonical } from "../../utils/entry-canonical";

describe("Entry canonical", () => {
  it("(1) No app definition in json — bare /@author/permlink", () => {
    const entry = { ...entryInstance1, ...{ json_metadata: {} } };
    const result = entryCanonical(entry);
    expect(result).toBe("https://ecency.com/@good-karma/awesome-hive");
  });

  it("(2) Ecency app — bare /@author/permlink", () => {
    const entry = { ...entryInstance1, ...{ json_metadata: { app: "ecency/0.1" } } };
    const result = entryCanonical(entry);
    expect(result).toBe("https://ecency.com/@good-karma/awesome-hive");
  });

  it("(3) Esteem app (legacy) — bare /@author/permlink", () => {
    const result = entryCanonical(entryInstance1);
    expect(result).toBe("https://ecency.com/@good-karma/awesome-hive");
  });

  it("(4) Hive.blog app — still self-canonical (no cross-frontend canonical)", () => {
    const entry = { ...entryInstance1, ...{ json_metadata: { app: "hiveblog/0.1" } } };
    const result = entryCanonical(entry);
    expect(result).toBe("https://ecency.com/@good-karma/awesome-hive");
  });

  it("(5) Explicit canonical_url in metadata wins", () => {
    const entry = {
      ...entryInstance1,
      ...{ json_metadata: { canonical_url: "http://foo.bar/baz" } }
    };
    const result = entryCanonical(entry);
    expect(result).toBe("http://foo.bar/baz");
  });

  it("(6) Strips https://www. prefix from explicit canonical_url", () => {
    const entry = {
      ...entryInstance1,
      ...{ json_metadata: { canonical_url: "https://www.foo.bar/baz" } }
    };
    const result = entryCanonical(entry);
    expect(result).toBe("https://foo.bar/baz");
  });

  it("(7) Ignores category — same canonical regardless of which community", () => {
    const entry = { ...entryInstance1, category: "hive-120026", json_metadata: {} };
    const result = entryCanonical(entry);
    expect(result).toBe("https://ecency.com/@good-karma/awesome-hive");
  });

  it("(8) Returns null for entries missing author or permlink", () => {
    const entry = { ...entryInstance1, permlink: "", json_metadata: {} };
    expect(entryCanonical(entry)).toBeNull();
  });
});
