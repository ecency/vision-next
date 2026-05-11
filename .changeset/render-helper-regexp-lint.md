---
"@ecency/render-helper": patch
---

Add `eslint-plugin-regexp` to the render-helper lint pipeline with
`regexp/no-super-linear-backtracking` and `regexp/no-super-linear-move`
set to `error`. The package processes untrusted user-authored markdown
on the SSR hot path; a single super-linear regex is enough to pin Node
for tens of seconds (see #782). Adding these rules to the package's
own ESLint config means the next ReDoS-shaped pattern fails CI at PR
time instead of in production.

This PR also clears every super-linear regex finding the new rules
surfaced in real source code, in addition to introducing the rules:

- Three new linear-time helpers in `helper.ts` (`stripHtmlTags`,
  `trimTrailingSlash`, `stripQueryString`) replace six bounded-input
  regex sites that previously tripped `no-super-linear-move`.
- The two URL regexes in `consts/regexes.const.ts` (`POST_REGEX`,
  `INTERNAL_POST_TAG_REGEX`) are anchored and use `[^/]+` for fixed
  path segments, eliminating the exchange-style backtracking while
  preserving the previous matching semantics — including the
  single-segment-middle constraint that the WHITE_LIST check in
  `a.method.ts` used to enforce indirectly.
- The `endPattern` cleanup in `methods/markdown-to-html.method.ts` was
  replaced with a non-regex helper
  (`moveBlockClosingTagOutOfParagraph`) that anchors on `</p>` via
  `indexOf` and walks back over whitespace and an optional `<br>`.
  Same behaviour as the regex; linear time on whitespace-heavy inputs.

After this PR there are no `regexp/*` disables remaining in
`packages/render-helper/src/`.
