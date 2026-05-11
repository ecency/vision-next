---
"@ecency/render-helper": minor
---

Add a slow-render warning to `markdown2Html`. When a single render takes
500 ms or longer, the function logs a `[render-helper] slow markdown
render: …ms author=@… permlink=… body_len=…` line to `console.warn`.
This surfaces both pathological inputs (e.g. ReDoS-prone tag
attributes) and merely-slow ones (huge bodies hitting the xmldom
fallback) from regular container logs without waiting for the SSR
watchdog to kill a container.

Cache hits do not log — only actual renders are timed. The threshold
is configurable via the new `setSlowRenderThresholdMs(ms)` export; set
to 0 to disable.
