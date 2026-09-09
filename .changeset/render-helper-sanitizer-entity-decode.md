---
"@ecency/render-helper": patch
---

Harden the sanitizer's numeric character reference decoding.

`sanitizeHtml` decoded every attribute value with a private decoder that called
`String.fromCodePoint` on the raw reference, so any value above U+10FFFF threw
`RangeError: Invalid code point`. It now reuses the hardened `decodeEntities`
from `helper.ts`, which maps out-of-range and overlong references to U+FFFD (as
the HTML spec asks) and never throws. Ordinary decimal, hex and zero-padded
references decode exactly as before.

One deliberate behaviour change: the shared decoder also resolves NAMED
references, which the private one did not. The decoded value is only ever
compared against, never written back, so this only affects which values pass
validation: `javascript&colon;` is still blanked (the scheme checks now see
through the obfuscation), and `<img src="https:&sol;&sol;host/a.png">` is no
longer blanked, because it decodes to the https URL a browser would resolve it
to anyway and is proxied like any other external image.

The throw escaped through both public entry points on chain-authored input:
`catchPostImage` (called per feed card, per search row and for the feed
thumbnail preload) on `<div title="&#x110000;">`, and `renderPostBody` on
`<div title="&#1114112;">x</span>`, where the sanitizer is the last-resort pass
that is supposed to recover from malformed HTML.
