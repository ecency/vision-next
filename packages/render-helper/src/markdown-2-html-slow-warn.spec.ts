import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { markdown2Html } from './markdown-2-html'
import { setSlowRenderThresholdMs } from './index'

describe('slow markdown render warning', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    setSlowRenderThresholdMs(500) // restore default
  })

  it('does not warn for fast renders at the default threshold', () => {
    markdown2Html('hello world', false)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('warns with body length + preview when a string render exceeds the threshold', () => {
    setSlowRenderThresholdMs(0.000001) // any non-trivial render exceeds this
    markdown2Html('hello world', false)
    expect(warnSpy).toHaveBeenCalledOnce()
    const msg = warnSpy.mock.calls[0][0] as string
    expect(msg).toMatch(/^\[render-helper\] slow markdown render: \d+ms /)
    expect(msg).toContain('body_len=11')
    expect(msg).toContain('preview="hello world"')
  })

  it('warns with author+permlink when an Entry render exceeds the threshold', () => {
    setSlowRenderThresholdMs(0.000001)
    const entry = {
      author: 'alice',
      permlink: 'first-post',
      last_update: '2026-05-11T00:00:00',
      body: 'hello world'
    }
    markdown2Html(entry as any, false)
    expect(warnSpy).toHaveBeenCalledOnce()
    const msg = warnSpy.mock.calls[0][0] as string
    expect(msg).toContain('author=@alice')
    expect(msg).toContain('permlink=first-post')
    expect(msg).toContain('body_len=11')
  })

  it('disables logging when the threshold is set to 0', () => {
    setSlowRenderThresholdMs(0)
    markdown2Html('hello world', false)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('does not log on a cache hit (only on actual renders)', () => {
    setSlowRenderThresholdMs(0.000001)
    const entry = {
      author: 'alice',
      permlink: 'second-post',
      last_update: '2026-05-11T00:00:00',
      body: 'hello world'
    }
    markdown2Html(entry as any, false)
    expect(warnSpy).toHaveBeenCalledOnce()
    warnSpy.mockClear()

    // Second call with the same cache key should not re-render and so should
    // not log even though the threshold is effectively zero.
    markdown2Html(entry as any, false)
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
