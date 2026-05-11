// scan-post-corpus.mjs — one-off finder for slow / hanging renderPostBody
// inputs from real Hive content.
//
// Pulls recent posts via the bridge API, runs each body through the
// deployed render-helper build in a worker thread (so a hang on one post
// doesn't lock the rest of the run), and prints the slow/timed-out ones.
//
// Build the package first:
//   pnpm --filter @ecency/render-helper build
//
// Then from the workspace root:
//   node packages/render-helper/scan-post-corpus.mjs
//   node packages/render-helper/scan-post-corpus.mjs --limit 1000 --sort created --tag hive-engine
//   node packages/render-helper/scan-post-corpus.mjs --threshold 200 --timeout 10
//
// Flags:
//   --rpc       <url>           Hive API endpoint (default https://api.hive.blog)
//   --sort      <sort>          bridge.get_ranked_posts sort (default 'created')
//   --tag       <tag>           Hive tag filter (default empty = all)
//   --limit     <n>             Total posts to scan (default 200)
//   --threshold <ms>            Surface renders ≥ this duration (default 500)
//   --timeout   <seconds>       Per-post hard timeout (default 5)
//   --out       <path>          Append CSV results to file (optional)
//
// Output: one line per post, with a summary at the end ordered by duration.

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { createRequire } from 'node:module'
import { performance } from 'node:perf_hooks'
import { appendFileSync, existsSync, writeFileSync } from 'node:fs'

if (!isMainThread) {
  // Worker: load the deployed build, render once, post result back.
  const wrequire = createRequire(import.meta.url)
  const { renderPostBody } = wrequire('./dist/node/index.cjs')

  const { body, author, permlink, payout } = workerData
  const t0 = performance.now()
  try {
    const seoContext = { authorReputation: 50, postPayout: payout ?? 0 }
    const html = renderPostBody(body, false, false, 'ecency.com', seoContext)
    parentPort.postMessage({ ok: true, ms: performance.now() - t0, htmlLen: html.length })
  } catch (e) {
    parentPort.postMessage({ ok: false, ms: performance.now() - t0, error: String(e?.message || e) })
  }
  process.exit(0)
}

// --- main thread ---

function parseArgs(argv) {
  const out = {
    rpc: 'https://api.hive.blog',
    sort: 'created',
    tag: '',
    limit: 200,
    threshold: 500,
    timeoutSeconds: 5,
    out: null
  }
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i]
    const v = argv[i + 1]
    switch (k) {
      case '--rpc':       out.rpc = v; i++; break
      case '--sort':      out.sort = v; i++; break
      case '--tag':       out.tag = v; i++; break
      case '--limit':     out.limit = parseInt(v, 10); i++; break
      case '--threshold': out.threshold = parseInt(v, 10); i++; break
      case '--timeout':   out.timeoutSeconds = parseInt(v, 10); i++; break
      case '--out':       out.out = v; i++; break
      case '--help':
      case '-h':
        console.log(`Usage: node scan-post-corpus.mjs [--rpc URL] [--sort SORT] [--tag TAG] [--limit N] [--threshold MS] [--timeout SECONDS] [--out CSV_PATH]`)
        process.exit(0)
    }
  }
  return out
}

async function rpc(url, method, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 })
  })
  if (!res.ok) {
    throw new Error(`RPC ${method} HTTP ${res.status}`)
  }
  const body = await res.json()
  if (body.error) throw new Error(`RPC ${method}: ${JSON.stringify(body.error).slice(0, 200)}`)
  return body.result
}

async function* iteratePosts({ rpc: url, sort, tag, limit }) {
  // Paginate via start_author/start_permlink as documented in HAF/bridge.
  let startAuthor = ''
  let startPermlink = ''
  let count = 0
  while (count < limit) {
    const pageSize = Math.min(100, limit - count)
    const result = await rpc(url, 'bridge.get_ranked_posts', {
      sort,
      tag,
      observer: '',
      limit: pageSize,
      start_author: startAuthor,
      start_permlink: startPermlink
    })
    if (!result || result.length === 0) return
    // First entry of pages after the first is the previous "cursor" — skip it.
    const start = startAuthor === '' ? 0 : 1
    for (let i = start; i < result.length; i++) {
      yield result[i]
      count++
      if (count >= limit) return
    }
    const last = result[result.length - 1]
    startAuthor = last.author
    startPermlink = last.permlink
    if (result.length < pageSize) return // out of content
  }
}

function timeRender(post, timeoutMs) {
  return new Promise((resolve) => {
    const w = new Worker(new URL(import.meta.url), {
      workerData: {
        body: post.body,
        author: post.author,
        permlink: post.permlink,
        payout: parseFloat(post.payout ?? 0)
      }
    })
    const timer = setTimeout(() => {
      w.terminate().then(() => resolve({ status: 'timeout', ms: timeoutMs }))
    }, timeoutMs)
    w.on('message', (m) => {
      clearTimeout(timer)
      resolve({ status: m.ok ? 'ok' : 'error', ms: m.ms, error: m.error })
    })
    w.on('error', (e) => {
      clearTimeout(timer)
      resolve({ status: 'error', ms: 0, error: String(e?.message || e) })
    })
  })
}

const args = parseArgs(process.argv)
const timeoutMs = args.timeoutSeconds * 1000
const results = []
let scanned = 0

// Append-or-create: keep prior rows across repeated scans (the help text
// promises "Append CSV results to file"). Only write the header when the
// file doesn't yet exist, so subsequent runs append rows below the
// existing data instead of clobbering it.
if (args.out && !existsSync(args.out)) {
  writeFileSync(args.out, 'author,permlink,body_len,status,ms\n')
}

console.log(`scanning ${args.limit} posts from ${args.rpc} (sort=${args.sort} tag=${args.tag || '*'}, threshold=${args.threshold}ms, timeout=${args.timeoutSeconds}s)`)

for await (const post of iteratePosts(args)) {
  scanned++
  const bodyLen = (post.body || '').length
  const r = await timeRender(post, timeoutMs)
  const tag = r.status === 'timeout' ? '⏱' : r.status === 'error' ? '✗' : (r.ms >= args.threshold ? '⚠' : '·')
  const line = `[${scanned}/${args.limit}] ${tag} @${post.author}/${post.permlink} body_len=${bodyLen} ${r.ms.toFixed(0)}ms${r.error ? ` error=${r.error}` : ''}`
  if (r.status !== 'ok' || r.ms >= args.threshold) {
    console.log(line)
  }
  if (args.out) appendFileSync(args.out, `${post.author},${post.permlink},${bodyLen},${r.status},${r.ms.toFixed(1)}\n`)
  if (r.status !== 'ok' || r.ms >= args.threshold) {
    results.push({ author: post.author, permlink: post.permlink, bodyLen, status: r.status, ms: r.ms, error: r.error })
  }
}

console.log(`\nscanned: ${scanned}`)
console.log(`slow (≥${args.threshold}ms): ${results.filter((x) => x.status === 'ok').length}`)
console.log(`timed out (≥${timeoutMs}ms): ${results.filter((x) => x.status === 'timeout').length}`)
console.log(`errored: ${results.filter((x) => x.status === 'error').length}`)

results.sort((a, b) => b.ms - a.ms)
const top = results.slice(0, 20)
if (top.length) {
  console.log(`\nTop ${top.length} slowest:`)
  for (const r of top) {
    console.log(`  ${r.ms.toFixed(0).padStart(6)}ms  ${r.status.padEnd(7)}  @${r.author}/${r.permlink}  (${r.bodyLen}b)`)
  }
}
if (args.out) console.log(`\nfull CSV: ${args.out}`)
