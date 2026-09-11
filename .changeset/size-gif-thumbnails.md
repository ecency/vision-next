---
"@ecency/render-helper": patch
---

Ask for the requested size when a post's cover image is a gif.

Every proxify in `getImage` fell back to the ORIGINAL dimensions for a `.gif`
source, so a caller asking for a 600x500 thumbnail was handed the whole file.
On the post behind ecency/vision-next#1802 that is 1.5 MB arriving in a 150px
feed slot, which was the single largest LCP cost on `/trending`. It reached
every sized caller, open graph images at 1200x630 included.

The reason was that the image host returned animated sources untransformed at
any size, so a sized URL only minted a second cache key holding the same bytes.
ecency/imagehoster#47 re-renders them at the requested box, keeping every frame
or passing through untouched, so the size is now worth asking for: that same
source at 600x500 is 195,318 bytes of animated WebP against 1,572,008 of GIF,
40 frames and the same 5000ms running time.
