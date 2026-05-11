---
"@ecency/render-helper": minor
---

Add a slow-render warning to `markdown2Html`. When a single render takes
500 ms or longer on the server, the function logs a
`[render-helper] slow markdown render: …ms author=@… permlink=… body_len=…`
line to `console.warn`. This surfaces both pathological inputs (e.g.
ReDoS-prone tag attributes) and merely-slow ones (huge bodies hitting
the xmldom fallback) from regular container logs without waiting for
the SSR watchdog to kill a container.

Cache hits are not timed. Default is **server-on, browser-off** — the
string overload is called from comment/draft preview paths with
unpublished user input, so emitting warnings in the browser would leak
draft text into the user's console and any client telemetry pipeline,
and would repeat on each keystroke. The log message never includes a
content excerpt for the same reason.

Threshold and per-environment behaviour are configurable via the new
`setSlowRenderThresholdMs(ms)` export: call with `500` from a
browser-only init to opt browser bundles in, or with `0` to disable
everywhere.
