import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Exercises the actual shipped public script (public/scripts/translate-dom-guard.js)
 * that hardens Node.prototype.insertBefore/removeChild against in-page
 * translators (Google/Chrome Translate). The translator moves DOM nodes out
 * from under React; on the next commit React calls insertBefore/removeChild
 * against a node whose parent has changed, which would otherwise throw a
 * NotFoundError and crash the whole route. The guard turns that throw into a
 * no-op. See facebook/react#11538.
 */
describe("translate-dom-guard public script", () => {
  const originalRemoveChild = Node.prototype.removeChild;
  const originalInsertBefore = Node.prototype.insertBefore;

  beforeAll(() => {
    // Note: build the path from the spec file string, not `new URL(...)` —
    // the jsdom global URL isn't recognized by Node's fileURLToPath.
    const specDir = dirname(fileURLToPath(import.meta.url));
    const scriptPath = resolve(specDir, "../../../public/scripts/translate-dom-guard.js");
    const source = readFileSync(scriptPath, "utf-8");
    // Run the IIFE against jsdom's global Node, exactly as the browser would.
    new Function(source)();
  });

  afterAll(() => {
    Node.prototype.removeChild = originalRemoveChild;
    Node.prototype.insertBefore = originalInsertBefore;
  });

  it("no-ops removeChild when the node is not a child of the parent (no throw)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const realParent = document.createElement("div");
    const foreignParent = document.createElement("div");
    const child = document.createElement("span");
    realParent.appendChild(child);

    // Simulates a translator having re-parented `child` under a <font> wrapper.
    const result = foreignParent.removeChild(child);

    expect(result).toBe(child);
    expect(child.parentNode).toBe(realParent); // untouched, not thrown
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("still removes a real child normally", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);

    const result = parent.removeChild(child);

    expect(result).toBe(child);
    expect(child.parentNode).toBeNull();
    expect(parent.childNodes.length).toBe(0);
  });

  it("no-ops insertBefore when the reference node is not a child of the parent (no throw)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const realParent = document.createElement("div");
    const foreignParent = document.createElement("div");
    const reference = document.createElement("span");
    realParent.appendChild(reference);
    const newNode = document.createElement("b");

    const result = foreignParent.insertBefore(newNode, reference);

    expect(result).toBe(newNode);
    expect(foreignParent.childNodes.length).toBe(0); // not inserted
    expect(newNode.parentNode).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("still inserts before a real reference node normally", () => {
    const parent = document.createElement("div");
    const reference = document.createElement("span");
    parent.appendChild(reference);
    const newNode = document.createElement("b");

    const result = parent.insertBefore(newNode, reference);

    expect(result).toBe(newNode);
    expect(parent.childNodes[0]).toBe(newNode);
    expect(parent.childNodes[1]).toBe(reference);
  });

  it("still appends when insertBefore reference is null", () => {
    const parent = document.createElement("div");
    const first = document.createElement("span");
    parent.appendChild(first);
    const newNode = document.createElement("b");

    parent.insertBefore(newNode, null);

    expect(parent.childNodes[1]).toBe(newNode);
  });
});
