import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { sourceEntries } from "../tsup.config";

/**
 * The SHAPE of the two builds is load-bearing, and in opposite directions.
 *
 * The browser build must stay SPLIT (an entry per source file). A single
 * pre-bundled file is one module to a consuming bundler, which can then neither
 * split it nor drop what a route never imports, so every page that touches any
 * export pays for all of it. On vision-web's community feed that chunk was
 * 270 KB parsed for one module, 237 KB of it never executed. Splitting took mean
 * First Load JS across 165 routes from 393 KB to 370 KB (#1804, PR #1834).
 *
 * The node build must stay a SINGLE BUNDLE, and not for symmetry. `splitting`
 * unifies module state across entry points, and `.` and `./hive` each holding
 * their OWN copy of hive-tx's mutable config (nodes, User-Agent, resilience,
 * server RPC proxy) is something a consumer depends on:
 * `apps/web/src/app/api/internal/seo/sitemap-generate/route.ts` calls `setNodes`
 * and `setUserAgent` through `@ecency/sdk/hive` to point ONE route at the
 * curated public-node list, while the rest of SSR keeps what `core/sdk-init.ts`
 * set through `ConfigManager`. Split the node build and that becomes
 * process-global for every concurrent render in the replica.
 *
 * Neither property is visible in any other check. The web app's route table
 * would simply grow back, quietly, and the SSR one would only show up as a
 * fleet-wide RPC change nobody connected to a build config.
 *
 * Two decisions inherited from
 * `packages/render-helper/test/dist-loads-in-plain-node.spec.ts`:
 *
 * It builds its own output rather than reading `dist/`. `dist` is committed and
 * the auto-changeset bot rebuilds it when the version label lands, so on a
 * branch that changes the build config the committed copy is legitimately
 * stale. `web-build.yml` also runs `pnpm -r test` with no preceding
 * `pnpm build:packages`.
 *
 * It loads the output in a real `node` process. Importing from inside vitest
 * would prove nothing, because Vite would resolve it, and that resolution is
 * the layer that hides packaging bugs.
 */

const exec = promisify(execFile);
const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** Generous: a cold CI worker builds the whole package from scratch here. */
const BUILD_MS = 300_000;
/** The child has to lose first, or a loaded worker reports a bare outer timeout
 *  instead of the subprocess error that says what actually went wrong. */
const CHILD_MS = 30_000;
const CASE_MS = CHILD_MS * 3;

let out: string;
const browser = () => join(out, "browser");
const node = () => join(out, "node");

beforeAll(async () => {
  // Under the package's own node_modules, never tracked by git: Node resolves
  // bare specifiers by walking up from the importing file, so the emitted
  // `import "@tanstack/react-query"` only finds its target from inside the
  // package tree. Building to the OS temp dir fails with ERR_MODULE_NOT_FOUND
  // on the first external.
  out = mkdtempSync(join(PKG, "node_modules", ".sdk-build-shape-"));
  await exec(join(PKG, "node_modules/.bin/tsup"), [], {
    cwd: PKG,
    timeout: BUILD_MS,
    env: { ...process.env, SDK_DIST_ROOT: out }
  });
}, BUILD_MS);

afterAll(() => {
  if (out) rmSync(out, { recursive: true, force: true });
});

/**
 * Every emitted JavaScript file under `dir`, recursively.
 *
 * Deliberately all three extensions: the browser build emits `.js` and the node
 * build `.mjs` plus `.cjs`, and both are inspected here, so a helper that only
 * knew about `.js` would silently report the node output as empty.
 */
function jsFiles(dir: string): string[] {
  const found: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|mjs|cjs)$/.test(e.name)) found.push(p);
    }
  };
  walk(dir);
  return found;
}

/**
 * Runs a snippet in a separate, real Node process and returns its JSON stdout.
 * Entry paths travel in the environment rather than being interpolated into the
 * snippet, so no code is built from a value.
 */
async function inNode(
  args: string[],
  env: Record<string, string>
): Promise<Record<string, unknown>> {
  const { stdout } = await exec(process.execPath, args, {
    cwd: PKG,
    timeout: CHILD_MS,
    env: { ...process.env, ...env }
  });
  return JSON.parse(stdout.trim()) as Record<string, unknown>;
}

const esm = (body: string) => ["--input-type=module", "-e", body];

describe("browser build stays splittable", () => {
  it("emits an entry per source module, not one bundle", () => {
    const files = jsFiles(browser());
    // Reverting to `splitting: false` with the two original entries would leave
    // exactly two. The real build emits ~1,100, so the bound only has to be far
    // from both numbers to name the regression unambiguously.
    expect(files.length).toBeGreaterThan(100);
  });

  it("makes index.js re-exports rather than a bundle", () => {
    const index = readFileSync(join(browser(), "index.js"), "utf8");
    // What a consumer's bundler needs in order to prune: the barrel points at
    // siblings instead of carrying the package inline.
    expect(index).toMatch(/from\s*["']\.\//);
    // The pre-bundled file this replaced was ~265 KB minified. Anything near
    // that means the split collapsed even if sibling files still exist.
    expect(statSync(join(browser(), "index.js")).size).toBeLessThan(120_000);
  });

  it("emits no import cycles", () => {
    // Bundling hides cycles; splitting turns them into real ESM cycles, which
    // hand a consumer `undefined` at module init and only for the import order
    // that happens to enter the graph at the wrong module.
    const files = jsFiles(browser());
    const own = new Set(files);
    const re =
      /(?:^|[;\n])\s*(?:import\s*(?:[^"';]*?\s*from\s*)?|export\s*(?:\*|\{[^}]*\})\s*from\s*)["']([^"']+)["']/g;
    const graph = new Map<string, string[]>();
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      const deps = new Set<string>();
      for (const m of src.matchAll(re)) {
        if (!m[1].startsWith(".")) continue;
        const t = resolve(dirname(f), m[1]);
        if (own.has(t)) deps.add(t);
      }
      graph.set(f, [...deps]);
    }
    const state = new Map<string, 1 | 2>();
    const cycles: string[][] = [];
    const dfs = (n: string, stack: string[]) => {
      state.set(n, 1);
      stack.push(n);
      for (const d of graph.get(n) ?? []) {
        if (state.get(d) === 1) cycles.push(stack.slice(stack.indexOf(d)).concat(d));
        else if (!state.has(d)) dfs(d, stack);
      }
      stack.pop();
      state.set(n, 2);
    };
    for (const n of graph.keys()) if (!state.has(n)) dfs(n, []);
    expect(cycles.map((c) => c.map((f) => relative(browser(), f)).join(" -> "))).toEqual([]);
  });
});

describe("node build stays one bundle per entry", () => {
  it("emits only the entry files, with no shared chunks", () => {
    const files = jsFiles(node()).map((f) => relative(node(), f)).sort();
    expect(files).toEqual(["hive.cjs", "hive.mjs", "index.cjs", "index.mjs"]);
  });

  it("keeps each entry self-contained", () => {
    for (const f of ["index.mjs", "hive.mjs"]) {
      const src = readFileSync(join(node(), f), "utf8");
      // A split node build would import siblings here. Statement-anchored,
      // because minified code can carry a matching sequence inside a string.
      expect(src).not.toMatch(/(?:^|[;\n])\s*(?:import|export)[^;\n]*?from\s*["']\.\//);
    }
  });

  it(
    "keeps @ecency/sdk and @ecency/sdk/hive on SEPARATE hive-tx config copies",
    async () => {
      // The property apps/web's sitemap-generate route depends on. Asserted on
      // behaviour, not on file layout, so it survives any future change to how
      // the node build is emitted.
      const result = await inNode(
        esm(`Promise.all([import(process.env.E_MAIN), import(process.env.E_HIVE)]).then(([main, hive]) => {
          hive.setNodes(["https://guard.invalid"]);
          console.log(JSON.stringify({ hive: hive.config.nodes, main: main.hiveTxConfig.nodes }));
        })`),
        { E_MAIN: join(node(), "index.mjs"), E_HIVE: join(node(), "hive.mjs") }
      );
      expect(result.hive).toEqual(["https://guard.invalid"]);
      expect(result.main).not.toEqual(["https://guard.invalid"]);
      expect((result.main as string[]).length).toBeGreaterThan(1);
    },
    CASE_MS
  );
});

describe("both builds load in plain Node and agree on their surface", () => {
  const keysEsm = (entryVar: string) =>
    esm(
      `import(process.env.${entryVar}).then((m) => console.log(JSON.stringify({ keys: Object.keys(m).sort() })))`
    );

  it(
    "browser and node ESM export the same names",
    async () => {
      const b = await inNode(keysEsm("E_ENTRY"), { E_ENTRY: join(browser(), "index.js") });
      const n = await inNode(keysEsm("E_ENTRY"), { E_ENTRY: join(node(), "index.mjs") });
      expect((b.keys as string[]).length).toBeGreaterThan(500);
      expect(b.keys).toEqual(n.keys);
    },
    CASE_MS
  );

  it(
    "the ./hive subpath agrees across both builds",
    async () => {
      const b = await inNode(keysEsm("E_ENTRY"), { E_ENTRY: join(browser(), "hive.js") });
      const n = await inNode(keysEsm("E_ENTRY"), { E_ENTRY: join(node(), "hive.mjs") });
      expect((b.keys as string[]).length).toBeGreaterThan(10);
      expect(b.keys).toEqual(n.keys);
    },
    CASE_MS
  );

  it(
    "the node CommonJS build loads and matches too",
    async () => {
      // What every plain `require` consumer gets: scripts, the newsletter
      // service and the hosting API.
      const cjs = await inNode(
        ["-e", `console.log(JSON.stringify({ keys: Object.keys(require(process.env.E_ENTRY)).sort() }))`],
        { E_ENTRY: join(node(), "index.cjs") }
      );
      const mjs = await inNode(keysEsm("E_ENTRY"), { E_ENTRY: join(node(), "index.mjs") });
      expect(cjs.keys).toEqual(mjs.keys);
    },
    CASE_MS
  );
});

describe("the browser entry list stays ordered", () => {
  it("lists real files in sorted order, not a glob", async () => {
    // Why this is asserted on the CONFIG and not by diffing two builds.
    //
    // Entry order feeds esbuild's chunk composition and its content hashes, and
    // `entry: ["src/**\/*.ts", ...]` leaves that order to the glob, which is not
    // stable across runs. Two builds of identical sources disagreed on 67 chunk
    // NAMES and 335 files by content, which would make every release of the
    // committed `dist` an arbitrary ~1,100-file diff.
    //
    // The first version of this guard built twice and compared. That was wrong:
    // esbuild's emission is not byte-reproducible even with the entries sorted
    // (0 to 23 files of 1,110 differ locally), and one chunk name drifted with
    // it on a CI runner, so the check failed for a reason the author could not
    // act on. A flaky gate teaches everyone to merge past it. This pins the one
    // thing actually under our control, with no build and no flake.
    const configs = (await import("../tsup.config")).default as Array<Record<string, unknown>>;
    const browserConfig = configs.find((c) => c.platform === "browser");
    expect(browserConfig).toBeDefined();
    const entry = browserConfig!.entry as string[];
    expect(Array.isArray(entry)).toBe(true);
    // A glob would reintroduce the churn even though `sourceEntries` still exists.
    expect(entry.every((e) => !e.includes("*"))).toBe(true);
    expect(entry.length).toBeGreaterThan(100);
    expect([...entry]).toEqual([...entry].sort());
  });

  it("excludes specs and declarations, and keeps both public entries", () => {
    const entries = sourceEntries();
    expect(entries.filter((e) => /\.(spec|test)\.ts$/.test(e))).toEqual([]);
    expect(entries.filter((e) => e.endsWith(".d.ts"))).toEqual([]);
    expect(entries).toContain(join("src", "index.ts"));
    expect(entries).toContain(join("src", "hive.ts"));
  });

  it("keeps the node build on the two public entries only", async () => {
    // The other half of the shape, at config level: the node build must not
    // grow an entry per file, because that is what would split it.
    const configs = (await import("../tsup.config")).default as Array<Record<string, unknown>>;
    const nodeConfig = configs.find((c) => c.platform === "node");
    expect(nodeConfig).toBeDefined();
    expect(nodeConfig!.entry).toEqual(["src/index.ts", "src/hive.ts"]);
    expect(nodeConfig!.splitting).toBeFalsy();
  });
});

describe("what each consumer resolves", () => {
  it("keeps the browser build reachable only through the browser condition", () => {
    // ecency-mobile resolves this package through Metro's condition set, which
    // is {default, import|require, react-native} on ios/android: `browser` is
    // added for platform `web` only (metro-config maps web -> ["browser"]), and
    // `@react-native/metro-config` supplies `react-native`. With no
    // `react-native` key here, native matches `import`/`require` and loads the
    // NODE build, which is why the split above cannot reach the app.
    //
    // Adding a `react-native` condition would silently move the app onto the
    // browser build and its ~1,100 files. That may be what you want one day;
    // measure a Metro bundle before and after, then update this test.
    const pkg = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8"));
    for (const subpath of [".", "./hive"]) {
      const entry = pkg.exports[subpath];
      expect(Object.keys(entry)).not.toContain("react-native");
      expect(entry.browser).toMatch(/^\.\/dist\/browser\//);
      // Everything off the browser (SSR, route handlers, scripts, mobile
      // native) has to keep landing on the single-bundle node build.
      for (const condition of ["import", "require", "default"]) {
        expect(entry[condition]).toMatch(/^\.\/dist\/node\//);
      }
    }
  });
});
