# Icon sizing convention

A UI glyph's rendered size is decided by **exactly one Tailwind `size-N` utility** (or one
sanctioned slot), on or immediately above the `<svg>`, at the call site. Never an SCSS/CSS
`svg { width/height }` rule. Never a `size=`, `width=`, or `height=` attribute on an icon.

## The scale

| class | px | use |
|---|---|---|
| `size-3.5` | 14 | dense rows: entry-votes hearts, pins, checkbox checks |
| `size-4` | 16 | **the default** — action rows, list icons, adornments |
| `size-5` | 20 | toolbars, navbars, menus (the Button-md tier) |
| `size-6` | 24 | card-emphasis glyphs (the package-native size) |

Status graphics and illustrations (`size-8` and up) are not glyphs; they keep their values
and are out of scope. Responsive and odd sizes compose natively: `size-6 lg:size-8`,
`size-[17px]` (exempt-marked).

## Sanctioned slots

Icons inside these carry **no size class** — the slot decides:

- **Button** `icon=` — 16px on `size="xs"`, 20px otherwise
- **InputGroup** prepend/append — 16px
- **DropdownItemWithIcon** — 16px

A call site that deliberately diverges from its slot tier carries exactly one **`!size-N`**
(the Tailwind important modifier — beats the slot's `[&>svg]` class deterministically).
`!size-N` is legal only inside sanctioned slots. `!w-N`/`!h-N` spellings are banned
everywhere.

## Hand-rolled element exports

The exports in `assets/img/svg.tsx`, `features/ui/svg.tsx`, `features/ui/icons.tsx` and
`decks/_components/icons.tsx` are JSX elements and cannot take props. Always render them
inside a sized sink, sizing **both axes**:

```tsx
<span className="inline-flex shrink-0 size-4 [&>svg]:size-full">{cashCoinSvg}</span>
// or, one class on a sink that renders many icons:
<div className="transaction-icon [&>svg]:size-4">{icon}</div>
```

Width-only sinks (`[&>svg]:w-4` alone) are banned — they letterbox against the svg's
intrinsic height.

## Failure philosophy

Package icons keep their intrinsic `width/height=24`. A forgotten call site renders loudly
oversized at 24px, not subtly wrong — deliberate: both visual bugs that shipped during the
2026-07 icon consolidation were the subtle kind.

## Exemptions

`data-icon-exempt` marks glyphs outside the convention (cropped-viewBox chevrons via
`VoteChevron`/`SliderChevron`, brand marks, the RC gauge, the transfer arrow). The ledger
is `scripts/icon-scss-manifest.json`; do not add exemptions without updating it.

## Portals

React portals detach from the DOM ancestor chain — a wrapping container's `[&_svg]` sink
does not reach portal content. Portal internals size their own icons.

## Accessibility

Decorative icons take `aria-hidden`; standalone meaningful icons take `role="img"` +
`aria-label`.
