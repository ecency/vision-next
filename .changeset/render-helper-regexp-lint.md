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

Pre-existing super-linear regexes are ratcheted with
`// eslint-disable-next-line` + `// TODO(redos)` comments — they all
sit on bounded or pre-filtered inputs and weren't the cause of the
#782 incident, so they're flagged for follow-up rather than fixed here.
