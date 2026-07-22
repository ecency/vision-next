import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

/**
 * A duplicate key in a locale JSON is invisible: JSON.parse silently keeps the
 * LAST value, so the earlier entry is dead and every call site resolves to the
 * survivor. `decks.columns.search-query` was declared twice — once as the label
 * "Search query", once as "Query: {{query}}" — so the two call sites that pass
 * no interpolation rendered the raw "Query: {{query}}" in the UI.
 *
 * Nothing else catches this: it is valid JSON, prettier reformats it happily,
 * and eslint never reads the file. JS has no `object_pairs_hook`, so the raw
 * text is scanned for keys repeated within one object.
 */
const LOCALES_DIR = path.join(__dirname, "../../features/i18n/locales");

/** Duplicate keys, as `parent.key` paths, in source order. */
function findDuplicateKeys(raw: string): string[] {
  const dups: string[] = [];
  const scopes: { keys: Set<string>; name: string }[] = [];
  let pendingKey: string | null = null;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (ch === '"') {
      // Read the literal, keeping escapes intact so the whole token can be
      // decoded: "k" and "k" are the same JSON key, so comparing raw
      // spellings would miss that pair as a duplicate.
      let literal = "";
      i++;
      while (i < raw.length && raw[i] !== '"') {
        if (raw[i] === "\\") {
          literal += raw[i] + raw[i + 1];
          i += 2;
        } else {
          literal += raw[i];
          i++;
        }
      }
      try {
        pendingKey = JSON.parse(`"${literal}"`);
      } catch {
        pendingKey = literal;
      }
    } else if (ch === ":" && pendingKey !== null) {
      const scope = scopes[scopes.length - 1];
      if (scope) {
        if (scope.keys.has(pendingKey)) {
          dups.push(scope.name ? `${scope.name}.${pendingKey}` : pendingKey);
        }
        scope.keys.add(pendingKey);
      }
      // Keep the key: if the value is an object, it names the new scope.
    } else if (ch === "{") {
      const parent = scopes[scopes.length - 1];
      const name = [parent?.name, pendingKey].filter(Boolean).join(".");
      scopes.push({ keys: new Set(), name });
      pendingKey = null;
    } else if (ch === "}") {
      scopes.pop();
      pendingKey = null;
    } else if (ch === "," || ch === "[" || ch === "]") {
      pendingKey = null;
    }
  }

  return dups;
}

describe("i18n locale files", () => {
  const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));

  it("finds locale files to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s declares no key twice in the same object", (file) => {
    const raw = fs.readFileSync(path.join(LOCALES_DIR, file), "utf-8");
    expect(findDuplicateKeys(raw)).toEqual([]);
  });

  it("detects a duplicate key that JSON.parse would hide", () => {
    const sample = '{ "a": { "k": "first", "k": "second" }, "b": { "k": "ok" } }';
    expect(JSON.parse(sample).a.k).toBe("second"); // silently survives
    expect(findDuplicateKeys(sample)).toEqual(["a.k"]);
  });

  it("does not flag the same key used in sibling objects", () => {
    expect(findDuplicateKeys('{ "a": { "k": 1 }, "b": { "k": 2 } }')).toEqual([]);
  });

  it("decodes escaped member names before comparing", () => {
    // "k" and "k" are the same JSON key, so this collapses too.
    const sample = String.raw`{ "a": { "k": 1, "k": 2 } }`;
    expect(Object.keys(JSON.parse(sample).a)).toEqual(["k"]);
    expect(findDuplicateKeys(sample)).toEqual(["a.k"]);
  });
});
