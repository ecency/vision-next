import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, "..");
const entryFile = resolve(packageRoot, "src/lib/index.ts");

if (!existsSync(entryFile)) {
  console.log("Skipping @ecency/renderer build because source files are not available.");
  process.exit(0);
}

const result = spawnSync("pnpm", ["run", "build:lib"], {
  cwd: packageRoot,
  stdio: "inherit"
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
