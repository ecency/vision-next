---
"@ecency/render-helper": patch
---

Replace the regex inside `removeDuplicateAttributes` with a linear-time
tokenizer. The previous pattern had catastrophic backtracking on inputs
like `<div style=background-color:yellow;">` (unquoted attribute value
followed by a stray quote), pinning the V8 regex engine for tens of
seconds on real post bodies and tripping the SSR event-loop watchdog.

Also drop a redundant `md.render(input)` call from the DOMParser
fallback path in `markdown-to-html.method.ts` — the markdown output
from the primary path is already available and re-rendering it cost
~100 ms per fallback hit on larger bodies.
