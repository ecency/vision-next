# @ecency/render-helper

## 2.4.35

### Patch Changes

- Fix ReDoS in render-helper that hung SSR for >30s (#782)

- [#782](https://github.com/ecency/vision-next/pull/782) [`5d39b3e`](https://github.com/ecency/vision-next/commit/5d39b3e4d40b8a9895ca87608a922694a4f0c377) Thanks [@feruzm](https://github.com/feruzm)! - Replace the regex inside `removeDuplicateAttributes` with a linear-time
  tokenizer. The previous pattern had catastrophic backtracking on inputs
  like `<div style=background-color:yellow;">` (unquoted attribute value
  followed by a stray quote), pinning the V8 regex engine for tens of
  seconds on real post bodies and tripping the SSR event-loop watchdog.

  Also drop a redundant `md.render(input)` call from the DOMParser
  fallback path in `markdown-to-html.method.ts` — the markdown output
  from the primary path is already available and re-rendering it cost
  ~100 ms per fallback hit on larger bodies.

## 2.4.34

### Patch Changes

- Feeds Performance improvements (#780)

## 2.4.32

### Patch Changes

- Render helper improvements (#756)

## 2.4.31

### Patch Changes

- LCP image src set (#755)

## 2.4.30

### Patch Changes

- Dom parser improvement (#753)

## 2.4.29

### Patch Changes

- Improve PWA (#752)

## 2.4.28

### Patch Changes

- Performance improvements, bundle optimization (#734)

## 2.4.26

### Patch Changes

- Thumbnail Waves and hivesigner fix (#728)

## 2.4.25

### Patch Changes

- Notification and iframe (#719)

## 2.4.24

### Patch Changes

- Fix odysee embeds (#710)

## 2.4.23

### Patch Changes

- Fix wrapping on render helper (#699)

## 2.4.22

### Patch Changes

- Render helper proxy fix (#698)

## 2.4.21

### Patch Changes

- Audio embeds (#687)

## 2.4.20

### Patch Changes

- Fix render-helper traverse (#686)

## 2.4.19

### Patch Changes

- Robust DOM traversal (#685)

## 2.4.18

### Patch Changes

- Fix speak (#661)

## 2.4.17

### Patch Changes

- Test and edge case fixes (#659)

## 2.4.16

### Patch Changes

- Improve webp, 3speak render-helper (#658)

## 2.4.15

### Patch Changes

- SEO context for Quality (#646)

## 2.4.14

### Patch Changes

- Render helper update (#643)
