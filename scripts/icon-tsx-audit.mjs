// Icon convention audit, TSX layer (docs/icons.md).
// TypeScript-AST walk over apps/web/src and apps/self-hosted/src. For every
// Uil* JSX element it flags: size/width/height attributes; glyph-tier w-/h-
// className tokens (variant- or !-prefixed included); !size-N outside a slot
// prop; and single-axis [&>svg]:w-/h- sink literals anywhere in a file.
// Bundle-1 ships this in report mode; the lock bundle adds the absence check
// (no size- token AND not in a slot) and flips CI to failing.
import { createRequire } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const require = createRequire(new URL("../package.json", import.meta.url));
const ts = require("typescript");

const ROOT = new URL("..", import.meta.url).pathname;
const SLOT_PROPS = new Set(["icon", "prepend", "append"]);
const GLYPH_AXIS = /(^|\s)([a-z-]+:)*!?[wh]-(3(\.5)?|4|5|6)(\s|$)/;
const SINGLE_AXIS_SINK = /\[&[>_]\s*svg\]:!?[wh]-\d/;
const failing = process.argv.includes("--fail");

const files = [];
for (const base of ["apps/web/src", "apps/self-hosted/src"]) {
  (function walk(dir) {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      const s = statSync(p);
      if (s.isDirectory()) walk(p);
      else if (/\.tsx$/.test(e)) files.push(p);
    }
  })(join(ROOT, base));
}

const findings = [];
for (const file of files) {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  if (SINGLE_AXIS_SINK.test(text)) {
    for (const m of text.matchAll(new RegExp(SINGLE_AXIS_SINK.source, "g")))
      findings.push({ rel, kind: "single-axis-sink", detail: m[0] });
  }

  const visit = (node, inSlotProp) => {
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && SLOT_PROPS.has(node.name.text)) {
      node.forEachChild((c) => visit(c, true));
      return;
    }
    if (
      (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      /^Uil/.test(node.tagName.text)
    ) {
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr) || !ts.isIdentifier(attr.name)) continue;
        const n = attr.name.text;
        if (n === "size" || n === "width" || n === "height")
          findings.push({ rel, kind: "attribute", detail: `${node.tagName.text} ${n}=` });
        if (n === "className" && attr.initializer) {
          let v = null;
          if (ts.isStringLiteral(attr.initializer)) v = attr.initializer.text;
          else if (
            ts.isJsxExpression(attr.initializer) &&
            attr.initializer.expression &&
            ts.isStringLiteral(attr.initializer.expression)
          )
            v = attr.initializer.expression.text;
          if (v !== null) {
            if (GLYPH_AXIS.test(v))
              findings.push({ rel, kind: "axis-pair-or-single", detail: `${node.tagName.text} "${v.slice(0, 60)}"` });
            if (/(^|\s)!size-\d/.test(v) && !inSlotProp)
              findings.push({ rel, kind: "important-outside-slot", detail: `${node.tagName.text} "${v.slice(0, 60)}"` });
          }
        }
      }
    }
    node.forEachChild((c) => visit(c, inSlotProp));
  };
  sf.forEachChild((c) => visit(c, false));
}

console.log(`icon-tsx-audit: ${findings.length} findings in ${new Set(findings.map((f) => f.rel)).size} files`);
const byKind = {};
for (const f of findings) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
console.log("  by kind:", JSON.stringify(byKind));
for (const f of findings.slice(0, 30)) console.log(`  ${f.kind} ${f.rel} | ${f.detail}`);
if (findings.length && failing) process.exit(1);
