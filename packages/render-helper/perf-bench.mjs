// Microbenchmark for render-helper hot paths.
// Run AFTER `pnpm build` so dist/node/index.cjs reflects current source.
//
//   pnpm --filter @ecency/render-helper build && node packages/render-helper/perf-bench.mjs
//
// Simulates a feed page render: N entries each going through
//   - postBodySummary(entry, 200)
//   - catchPostImage at three (w,h) variants (blur 0×0, grid 600×500, row 260×200)
// then a second pass to measure cache-warm behavior.

import { performance } from 'node:perf_hooks'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { catchPostImage, postBodySummary, setCacheSize } = require('./dist/node/index.cjs')

const FILLER_PARAGRAPH =
  'Lorem ipsum dolor sit amet, **consectetur** adipiscing elit. ' +
  'Visit [Ecency](https://ecency.com) for the *best* Hive experience. ' +
  'Some inline `code` and a list:\n\n- one\n- two\n- three\n\n' +
  '> A blockquote with a link http://example.com/path?q=1 and more text.\n\n'

function makeBody(seed) {
  const paragraphs = 8
  let body = `# Post ${seed}\n\n`
  for (let i = 0; i < paragraphs; i++) {
    body += FILLER_PARAGRAPH
    if (i % 3 === 0) {
      body += `![alt text](https://files.peakd.com/file/peakd-hive/img-${seed}-${i}.jpg)\n\n`
    }
  }
  body +=
    '\nAnd a footnote reference[^1].\n\n[^1]: This is the footnote body with some [link](https://hive.io).\n'
  return body
}

function makeEntry(i) {
  const author = `author${i % 7}`
  const permlink = `post-${i}`
  const hasMetaImage = i % 3 === 0
  const meta = hasMetaImage
    ? { image: [`https://files.peakd.com/file/peakd-hive/meta-${i}.jpg`], tags: ['hive'] }
    : { tags: ['hive'] }
  return {
    author,
    permlink,
    last_update: '2026-05-01T00:00:00',
    updated: '2026-05-01T00:00:00',
    body: makeBody(i),
    json_metadata: meta,
  }
}

function bench(label, fn, iterations) {
  fn() // warmup
  const start = performance.now()
  for (let i = 0; i < iterations; i++) fn()
  const elapsed = performance.now() - start
  const perCall = elapsed / iterations
  console.log(
    `  ${label.padEnd(36)} ${elapsed.toFixed(1).padStart(8)} ms total   ${perCall.toFixed(3).padStart(7)} ms/call`,
  )
}

function runFeedPage(entries) {
  for (const entry of entries) {
    postBodySummary(entry, 200)
    catchPostImage(entry, 0, 0)
    catchPostImage(entry, 600, 500)
    catchPostImage(entry, 260, 200)
  }
}

const ENTRY_COUNT = 20
const PAGE_RENDERS = 30
const entries = Array.from({ length: ENTRY_COUNT }, (_, i) => makeEntry(i))

console.log(
  `\nrender-helper perf-bench: ${ENTRY_COUNT} entries × ${PAGE_RENDERS} renders`,
)
console.log(`node ${process.version}\n`)

console.log('— default cache size —')
bench('1× page render (cold)', () => runFeedPage(entries), 1)
bench('page render (warm)', () => runFeedPage(entries), PAGE_RENDERS)

console.log('\n— forced cache size 60 —')
setCacheSize(60)
bench('1× page render (cold)', () => runFeedPage(entries), 1)
bench('page render (warm)', () => runFeedPage(entries), PAGE_RENDERS)

console.log('\n— forced cache size 500 —')
setCacheSize(500)
bench('1× page render (cold)', () => runFeedPage(entries), 1)
bench('page render (warm)', () => runFeedPage(entries), PAGE_RENDERS)

console.log('\n— postBodySummary on raw string (cache bypass) —')
const bodies = entries.map((e) => e.body)
let cursor = 0
bench(
  'postBodySummary(string) ×600',
  () => {
    postBodySummary(bodies[cursor++ % bodies.length], 200)
  },
  600,
)

console.log()
