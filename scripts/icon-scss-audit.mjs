// Icon convention audit, CSS layer (docs/icons.md).
// Walks every SCSS/CSS file under apps/web/src and flags rules that size an svg
// (width/height declarations, or @apply with w-/h-/size- utilities, inside a
// selector mentioning svg). Each flagged rule must appear in
// scripts/icon-scss-manifest.json; a rule marked deleted must not reappear.
// Exit 1 on violations. Report-only with --report.
import { createRequire } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const require = createRequire(new URL("../package.json", import.meta.url));
const postcss = require("postcss");
const scssSyntax = require("postcss-scss");

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "apps/web/src");
const manifest = JSON.parse(readFileSync(join(ROOT, "scripts/icon-scss-manifest.json"), "utf8"));
const reportOnly = process.argv.includes("--report");

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(scss|css)$/.test(e)) files.push(p);
  }
})(SRC);

const findings = [];
for (const file of files) {
  const rel = relative(ROOT, file);
  let root;
  try {
    root = postcss.parse(readFileSync(file, "utf8"), { syntax: scssSyntax, from: file });
  } catch (err) {
    findings.push({ file: rel, selector: "(parse error)", detail: String(err).slice(0, 120) });
    continue;
  }
  root.walkRules((rule) => {
    if (!/(^|[\s>+~(,])svg\b|\bsvg\s*[{,]|&\s*svg/.test(rule.selector) && !/svg/.test(rule.selector)) return;
    rule.walkDecls((decl) => {
      const sizing =
      /^(width|height|min-width|min-height|max-width|max-height)$/.test(decl.prop) ||
        (decl.prop === "@apply") ||
        (decl.prop.startsWith("--") ? false : false);
      if (sizing) findings.push({ file: rel, selector: rule.selector.replace(/\s+/g, " ").slice(0, 90), decl: `${decl.prop}: ${decl.value}` });
    });
    rule.walkAtRules("apply", (at) => {
      if (/\b(!?[wh]-|!?size-)/.test(at.params))
        findings.push({ file: rel, selector: rule.selector.replace(/\s+/g, " ").slice(0, 90), decl: `@apply ${at.params}` });
    });
  });
}

const key = (f) => `${f.file} | ${f.selector} | ${f.decl ?? f.detail ?? ""}`;

if (process.argv.includes("--write-manifest")) {
  // Regenerate the ledger from live findings, preserving existing statuses.
  const prev = new Map(manifest.rules.map((r) => [r.key ?? r.where, r.status]));
  const rules = findings.map((f) => ({ key: key(f), status: prev.get(key(f)) ?? "owned:pending" }));
  const { writeFileSync } = await import("node:fs");
  writeFileSync(join(ROOT, "scripts/icon-scss-manifest.json"),
    JSON.stringify({ comment: manifest.comment, rules }, null, 1) + "\n");
  console.log(`manifest written: ${rules.length} declarations`);
  process.exit(0);
}

const known = new Map(manifest.rules.map((r) => [r.key ?? r.where, r.status]));
const unowned = findings.filter((f) => !known.has(key(f)));
const reappeared = findings.filter((f) => known.get(key(f)) === "deleted");
console.log(`icon-scss-audit: ${findings.length} svg-sizing declarations in ${new Set(findings.map((f) => f.file)).size} files; ${unowned.length} unowned; ${reappeared.length} deleted-reappeared`);
for (const f of [...unowned, ...reappeared].slice(0, 20)) console.log(`  VIOLATION ${key(f)}`);
if ((unowned.length || reappeared.length) && !reportOnly) process.exit(1);
