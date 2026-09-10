---
"@ecency/render-helper": patch
---

Add `getEntryCardImageRawUrl`, the raw (pre-proxify) URL of the image a CARD
renders.

`getEntryImageRawUrl` answers a body/LCP-preload question and deliberately skips
`json_metadata.thumbnails`, while `catchPostImage` reads thumbnails first. A
caller that needs to reason about the file a card will actually request — its
extension, for instance — was therefore able to inspect one asset while the card
rendered another. The new export mirrors catchPostImage's precedence:
thumbnails, then image, then the first body image.
