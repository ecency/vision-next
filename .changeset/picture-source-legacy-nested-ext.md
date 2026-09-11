---
"@ecency/render-helper": patch
---

Judge a legacy sized-proxy URL's `<picture>` eligibility by the file it wraps.

`isPictureEligibleRawUrl` waved `images.hive.blog/<WxH>/…` and
`steemitimages.com/<WxH>/…` through unconditionally, on the grounds that a
pinned format could not change what the reader sees: the origin returned the
ORIGINAL bytes for `?format=avif` on an animated source. ecency/imagehoster#47
ended that. Animated sources are re-rendered now. Since libvips cannot write an
animated AVIF, `?format=avif` resolves to WebP, or to the untouched source when
the render is over the host's output budget. Either way
`<source type="image/avif">` described bytes that were not AVIF. The browser
committed to that source without ever reaching the `<img>` fallback.

These URLs never actually hid their extension: the nested source sits in the
path, where the same extractor the `/p/` hash is built from returns it. They are
now judged by that nested file under the existing rules. Measured over 804 live
posts, 94.6% of them wrap a static raster and keep their `<picture>`.
