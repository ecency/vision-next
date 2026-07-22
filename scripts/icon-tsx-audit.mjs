// Icon convention audit, TSX layer (docs/icons.md).
// TypeScript-AST walk over apps/web/src and apps/self-hosted/src. For every
// Uil* JSX element it flags: size/width/height attributes; glyph-tier w-/h-
// className tokens (variant- or !-prefixed included); !size-N outside a slot
// prop; single-axis [&>svg]:w-/h- sink literals anywhere in a file; and — the
// lock-bundle absence check (rule iii) — a Uil* element that is not inside a
// sanctioned slot prop and has no size- token in its className ("unsized-bare").
// Elements carrying a data-icon-exempt JSX attribute are skipped by every rule
// branch. CI runs with --fail: any finding exits 1.
import { createRequire } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const require = createRequire(new URL("../package.json", import.meta.url));
const ts = require("typescript");

const ROOT = new URL("..", import.meta.url).pathname;
// Sanctioned slots only (docs/icons.md). Matching on attribute name alone let
// any component with an `icon=` prop silently exempt its glyphs from rule iii.
const SLOT_COMPONENTS = new Set(["Button", "InputGroup", "DropdownItemWithIcon"]);
// `append` is deliberately absent: InputGroup's append wrapper has no
// [&>svg]:size-4 sink (input-group.tsx - only prepend does), so an appended icon
// has no implicit owner and must size itself.
const SLOT_PROPS = new Set(["icon", "prepend"]);
const GLYPH_AXIS = /(^|\s)([a-z-]+:)*!?[wh]-(3(\.5)?|4|5|6)(\s|$)/;
const SINGLE_AXIS_SINK = /\[&[^\]]*svg\]:!?[wh]-\d/;
// size-4, size-3.5, !size-3, lg:size-8, size-[17px], size-full — any spelling
// of a size- utility counts as "sized" for the absence check.
const SIZE_TOKEN = /(^|[\s"'`{(:!])([a-z-]+:)*!?size-(\d|\[|full)/;
// An ancestor sink ([&>svg]:size-N / [&_svg]:size-N) is a valid single owner for
// the glyphs beneath it; rule iii must not demand a second one on the icon.
const CHILD_SINK = /\[&>\s*svg\]:!?size-(\d|\[|full)/;
const DESCENDANT_SINK = /\[&_\s*svg\]:!?size-(\d|\[|full)/;
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

// True when the nearest enclosing JSX element of `node` (or `node` itself, for
// opening/self-closing elements) carries a data-icon-exempt attribute.
const hasExemptAttr = (attrsOwner) =>
  attrsOwner.attributes.properties.some(
    (a) => ts.isJsxAttribute(a) && a.name.getText() === "data-icon-exempt"
  );
// True when an ancestor element carries a both-axes svg sink that can actually
// reach this icon: a child sink ([&>svg]) only governs a direct child, while a
// descendant sink ([&_svg]) reaches any depth.
const ancestorSink = (node) => {
  let depth = 0;
  for (let n = node.parent; n; n = n.parent) {
    const el = ts.isJsxElement(n) ? n.openingElement : n;
    if (!ts.isJsxSelfClosingElement(el) && !ts.isJsxOpeningElement(el)) continue;
    for (const a of el.attributes.properties) {
      if (!ts.isJsxAttribute(a) || !a.initializer) continue;
      const src = a.initializer.getText();
      if (DESCENDANT_SINK.test(src)) return true;
      if (depth === 0 && CHILD_SINK.test(src)) return true;
    }
    depth += 1;
  }
  return false;
};
const nearestJsxExempt = (node) => {
  for (let n = node; n; n = n.parent) {
    if (ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) {
      if (hasExemptAttr(n)) return true;
    } else if (ts.isJsxElement(n) && hasExemptAttr(n.openingElement)) return true;
  }
  return false;
};

const findings = [];
for (const file of files) {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const visit = (node, inSlotProp) => {
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && SLOT_PROPS.has(node.name.text)) {
      const owner = node.parent?.parent;
      const ownerName =
        owner && ts.isIdentifier(owner.tagName) ? owner.tagName.text : "";
      // Only a sanctioned slot may size its icon implicitly; a Uil nested inside
      // a wrapper within the slot is out of the slot's [&>svg] reach, so the
      // exemption stops at the slot's direct element value.
      node.forEachChild((c) => visit(c, SLOT_COMPONENTS.has(ownerName)));
      return;
    }
    // Single-axis [&>svg]:w-/h- sinks, on any string literal in the file —
    // skipped when the literal sits inside a data-icon-exempt element.
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      SINGLE_AXIS_SINK.test(node.text) &&
      !nearestJsxExempt(node)
    ) {
      for (const m of node.text.matchAll(new RegExp(SINGLE_AXIS_SINK.source, "g")))
        findings.push({ rel, kind: "single-axis-sink", detail: m[0] });
    }
    if (
      (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      /^Uil/.test(node.tagName.text) &&
      !hasExemptAttr(node)
    ) {
      let sized = false;
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
            if (SIZE_TOKEN.test(` ${v}`)) sized = true;
            if (GLYPH_AXIS.test(v))
              findings.push({ rel, kind: "axis-pair-or-single", detail: `${node.tagName.text} "${v.slice(0, 60)}"` });
            if (/(^|\s)!size-\d/.test(v) && !inSlotProp)
              findings.push({ rel, kind: "important-outside-slot", detail: `${node.tagName.text} "${v.slice(0, 60)}"` });
          } else if (SIZE_TOKEN.test(attr.initializer.getText())) {
            // Dynamic className (clsx/template): lenient — any size- spelling
            // in the expression source counts as sized.
            sized = true;
          }
        }
      }
      // Rule iii (absence check): not inside a sanctioned slot prop and no
      // size- token in the className — the glyph has no sizing owner.
      if (!inSlotProp && !sized && !ancestorSink(node))
        findings.push({ rel, kind: "unsized-bare", detail: node.tagName.text });
    }
    // A non-icon element inside a slot (e.g. icon={<span>{fooSvg}</span>}) puts
    // its children outside the slot's [&>svg] child sink, so they need their own
    // owner again.
    const wrapper =
      (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) &&
      !(ts.isIdentifier(node.tagName ?? node.openingElement?.tagName ?? {}) &&
        /^Uil/.test((node.tagName ?? node.openingElement.tagName).text));
    node.forEachChild((c) => visit(c, inSlotProp && !wrapper));
  };
  sf.forEachChild((c) => visit(c, false));
}

console.log(`icon-tsx-audit: ${findings.length} findings in ${new Set(findings.map((f) => f.rel)).size} files`);
const byKind = {};
for (const f of findings) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
console.log("  by kind:", JSON.stringify(byKind));
for (const f of findings) console.log(`  ${f.kind} ${f.rel} | ${f.detail}`);
if (findings.length && failing) process.exit(1);
