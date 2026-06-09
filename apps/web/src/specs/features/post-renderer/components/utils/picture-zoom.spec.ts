import { describe, it, expect } from 'vitest'
import { zoomReplaceTarget, zoomEffectiveParent } from '@/features/post-renderer/components/utils/picture-zoom'

describe('picture-zoom helpers (shared by both medium-zoom enhancers)', () => {
  describe('zoomReplaceTarget', () => {
    it('returns the enclosing <picture> when the <img> is its direct child', () => {
      const pic = document.createElement('picture')
      const img = document.createElement('img')
      pic.appendChild(img)
      expect(zoomReplaceTarget(img)).toBe(pic)
    })
    it('returns the <img> itself when not inside a <picture>', () => {
      const p = document.createElement('p')
      const img = document.createElement('img')
      p.appendChild(img)
      expect(zoomReplaceTarget(img)).toBe(img)
    })
    it('returns the <img> when it has no parent', () => {
      const img = document.createElement('img')
      expect(zoomReplaceTarget(img)).toBe(img)
    })
  })

  describe('zoomEffectiveParent', () => {
    it('looks through a <picture> to its parent (so linked images stay detected)', () => {
      const a = document.createElement('a')
      const pic = document.createElement('picture')
      a.appendChild(pic)
      expect(zoomEffectiveParent(pic)).toBe(a)
    })
    it('returns the node itself when it is not a <picture>', () => {
      const p = document.createElement('p')
      expect(zoomEffectiveParent(p)).toBe(p)
    })
  })
})
