import fs from "fs";
import path from "path";
import * as unicons from "@/features/ui/unicons";

// next.config.js aliases "@tooni/iconscout-unicons-react" to the slim local
// unicons.tsx, but TypeScript keeps resolving the full npm package. An icon
// missing from the local file therefore typechecks and then renders as
// undefined in the built app ("Element type is invalid"). This spec walks the
// source tree and asserts every imported icon actually exists locally.

const SRC_ROOT = path.resolve(__dirname, "../..");
const IMPORT_RE = /import\s*(?:type\s*)?{([^}]+)}\s*from\s*["']@tooni\/iconscout-unicons-react["']/g;

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.spec\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("unicons alias coverage", () => {
  it("exports every icon the app imports from @tooni/iconscout-unicons-react", () => {
    const usages = new Map<string, string[]>();

    for (const file of collectSourceFiles(SRC_ROOT)) {
      const content = fs.readFileSync(file, "utf8");
      for (const match of content.matchAll(IMPORT_RE)) {
        for (const raw of match[1].split(",")) {
          const name = raw.split(/\s+as\s+/)[0].trim().replace(/^type\s+/, "");
          if (!name) {
            continue;
          }
          const files = usages.get(name) ?? [];
          files.push(path.relative(SRC_ROOT, file));
          usages.set(name, files);
        }
      }
    }

    expect(usages.size).toBeGreaterThan(0);

    const missing = [...usages.entries()]
      .filter(([name]) => typeof (unicons as Record<string, unknown>)[name] === "undefined")
      .map(([name, files]) => `${name} (used in ${files.join(", ")})`);

    expect(missing, `add these icons to src/features/ui/unicons.tsx: ${missing.join("; ")}`).toEqual(
      []
    );
  });
});
