// Authoritative allowlist of hosts the renderer is allowed to embed in an
// <iframe>. This is the SAME trust boundary that iframe.method.ts and
// a.method.ts already enforce via per-provider regexes — it is consolidated
// here so the sanitizer (central, authoritative) and the client video
// extensions (belt-and-suspenders) validate against ONE list instead of
// diverging copies.
//
// Every host listed here is one that a.method.ts / iframe.method.ts can emit
// as an https embed target. Subdomain-suffix tricks (play.3speak.tv.evil.com)
// fail because we compare the parsed hostname for EXACT equality, and
// protocol-relative / http / javascript: / data: values fail the https check.
export const ALLOWED_EMBED_HOSTS: ReadonlySet<string> = new Set([
  // YouTube
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  // Vimeo
  'player.vimeo.com',
  // Twitch
  'player.twitch.tv',
  // DTube
  'emb.d.tube',
  // 3Speak (video + audio)
  'play.3speak.tv',
  '3speak.tv',
  'audio.3speak.tv',
  // Loom
  'www.loom.com',
  // Spotify
  'open.spotify.com',
  // SoundCloud
  'w.soundcloud.com',
  // BitChute
  'www.bitchute.com',
  'bitchute.com',
  // Rumble
  'www.rumble.com',
  'rumble.com',
  // Brighteon
  'www.brighteon.com',
  'brighteon.com',
  // VIMM
  'www.vimm.tv',
  // BrandNewTube
  'brandnewtube.com',
  // LBRY / Odysee
  'lbry.tv',
  'odysee.com',
  // Skatehive / Skatehype
  'ipfs.skatehive.app',
  'www.skatehype.com',
  'skatehype.com',
  // archive.org
  'archive.org',
  // Truvvl
  'embed.truvvl.com',
  // Aureal
  'aureal-embed.web.app',
  'www.aureal-embed.web.app',
  // Dapplr (player.*.dapplr.in / *.dapplr.in) — host suffix, handled below
])

// Dapplr embeds come from arbitrary `<region>.dapplr.in` subdomains (see
// DAPPLR_REGEX), so they need a suffix check rather than an exact-host entry.
const ALLOWED_EMBED_HOST_SUFFIXES: readonly string[] = ['.dapplr.in']

/**
 * True iff `value` is an absolute https:// URL whose host is one the renderer
 * is permitted to embed. Used to validate data-embed-src / data-video-href in
 * the sanitizer and the iframe `src` the client video extensions assign.
 *
 * Defensive: never throws (a malformed URL returns false), rejects every
 * non-https scheme (javascript:, data:, http:, protocol-relative //host), and
 * compares the parsed hostname so an attacker can't smuggle an allowed host as
 * a path/query/userinfo/subdomain-suffix segment.
 */
export function isAllowedEmbedSrc(value?: string | null): boolean {
  if (!value) return false
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  if (ALLOWED_EMBED_HOSTS.has(host)) return true
  return ALLOWED_EMBED_HOST_SUFFIXES.some(suffix => host.endsWith(suffix))
}
