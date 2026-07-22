# Icon sizing convention

A UI glyph's rendered size is decided by **exactly one Tailwind `size-N` utility** (or one
sanctioned slot), on or immediately above the `<svg>`, at the call site. Never an SCSS/CSS
`svg { width/height }` rule. Never a `size=`, `width=`, or `height=` attribute on an icon.

**Enforcement is active.** The ESLint `no-restricted-syntax` icon rules are errors, and CI
(`typecheck.yml`) runs both audits failing: `icon-scss-audit.mjs` (ledger) and
`icon-tsx-audit.mjs --fail`. The TSX audit flags size/width/height attributes, glyph-tier
`w-`/`h-` classes, `!size-N` outside a slot, single-axis `[&>svg]:w-/h-` sinks, and —
rule iii, the absence check — any `Uil*` element that is not inside a sanctioned slot prop
(JSX `icon=`/`prepend=`/`append=`) and has no `size-` token in its className
("unsized-bare"). Elements carrying `data-icon-exempt` are skipped by every rule branch.

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
`decks/_components/icons.tsx` are JSX elements and cannot take props. Uil-based exports
carry `className="size-6"` (or their measured pin) — equal to the package-native 24px, so
a forgotten call site still fails loudly at 24px, and any call-site sink (`[&>svg]:size-N`,
higher specificity) still wins. Always render them inside a sized sink, sizing **both
axes**:

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

`data-icon-exempt` goes **on the icon element itself** for the attribute, axis and
absence rules — marking a wrapper does not exempt the `Uil*` children beneath it.
(Only the single-axis-sink rule honours an exempt ancestor, since it inspects the
class string on that ancestor.) It marks glyphs outside the convention (cropped-viewBox chevrons via
`VoteChevron`/`SliderChevron`, brand marks, the RC gauge, the transfer arrow). The ledger
is `scripts/icon-scss-manifest.json`; do not add exemptions without updating it.

## Portals

React portals detach from the DOM ancestor chain — a wrapping container's `[&_svg]` sink
does not reach portal content. Portal internals size their own icons.

## Accessibility

Decorative icons take `aria-hidden`; standalone meaningful icons take `role="img"` +
`aria-label`.

## What enforcement does and does not catch

Enforcement is active: ESLint icon rules are errors, and CI runs both audits with
the TSX one at `--fail`. Three rules apply — banned attributes, banned `w-N h-N`
glyph pairs and single-axis sinks, and the absence check (`unsized-bare`: a `Uil*`
that is neither the direct value of a sanctioned slot nor covered by a `size-`
token or an ancestor `[&…svg]:size-N` sink).

**Known gap — dynamic classNames.** The absence check reads *literal* class
strings. When a className is built dynamically it falls back to a source-text
search for a `size-` token, so these pass without a guarantee:

```tsx
<UilHeart className={clsx(isBig && "size-6")} />   // unsized when isBig is false
<UilHeart className={className ?? "size-4"} />      // unsized if a caller passes its own
```

Prefer a literal `size-N` on the icon, or a `[&>svg]:size-N` sink on its container,
so the tool can actually see the owner. A renamed import (`const Icon = UilHeart`)
is likewise invisible — the rules match the `Uil*` tag name.
