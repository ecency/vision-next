// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContext, runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

/**
 * chunk-reload.js recovers a tab whose HTML references chunks a deploy removed.
 * Its sessionStorage-less fallback marks the URL with `_cr=1` so it can only
 * reload once. Appending that to `location.href` put the marker inside the
 * fragment on any hashed URL, where the `location.search` check could never see
 * it, so the fallback reloaded forever.
 */
const SOURCE = readFileSync(
  join(__dirname, "..", "..", "..", "public", "scripts", "chunk-reload.js"),
  "utf8"
);

function run(href: string) {
  const url = new URL(href);
  const replaced: string[] = [];
  const reloaded: string[] = [];
  const listeners: Record<string, ((event: unknown) => void)[]> = {};
  const window = {
    location: {
      href,
      origin: url.origin,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      replace: (u: string) => replaced.push(u),
      reload: () => reloaded.push(href)
    },
    addEventListener: (type: string, fn: (event: unknown) => void) => {
      (listeners[type] ??= []).push(fn);
    }
  };
  // Force the fallback branch: this is the path the bug lived on.
  const sessionStorage = {
    getItem() {
      throw new Error("sessionStorage unavailable");
    },
    setItem() {
      throw new Error("sessionStorage unavailable");
    }
  };
  runInNewContext(SOURCE, createContext({ window, sessionStorage, JSON, Date }));

  const fireChunk404 = () =>
    listeners["error"]?.forEach((fn) =>
      fn({ target: { tagName: "SCRIPT", src: `${url.origin}/_next/static/chunks/9-abc.js` } })
    );
  return { fireChunk404, replaced, reloaded };
}

describe("chunk-reload.js URL guard fallback", () => {
  it("puts the guard in the query, not the fragment, when the URL has a hash", () => {
    const { fireChunk404, replaced } = run("https://ecency.com/@user/post#comments");
    fireChunk404();

    expect(replaced).toHaveLength(1);
    const next = new URL(replaced[0]);
    expect(next.searchParams.get("_cr")).toBe("1");
    expect(next.hash).toBe("#comments");
    expect(next.pathname).toBe("/@user/post");
  });

  it("is idempotent: a URL already carrying the guard does not reload again", () => {
    const { fireChunk404, replaced } = run("https://ecency.com/@user/post?_cr=1#comments");
    fireChunk404();

    expect(replaced).toEqual([]);
  });

  it("keeps existing query params and appends with &", () => {
    const { fireChunk404, replaced } = run("https://ecency.com/created/my?a=1#x");
    fireChunk404();

    const next = new URL(replaced[0]);
    expect(next.searchParams.get("a")).toBe("1");
    expect(next.searchParams.get("_cr")).toBe("1");
    expect(next.hash).toBe("#x");
  });

  it("still guards a URL with no query and no hash", () => {
    const { fireChunk404, replaced } = run("https://ecency.com/discover");
    fireChunk404();

    expect(replaced[0]).toBe("https://ecency.com/discover?_cr=1");
  });

  it("ignores assets that are not ours", () => {
    const url = new URL("https://ecency.com/discover");
    const { replaced } = run(url.href);
    expect(replaced).toEqual([]);
  });
});
