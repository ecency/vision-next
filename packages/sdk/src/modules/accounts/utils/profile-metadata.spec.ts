import { describe, it, expect } from 'vitest'
import {
  parseProfileMetadata,
  extractAccountProfile,
  buildProfileMetadata,
  parsePostingMetadataRoot,
  buildPostingJsonMetadata
} from './profile-metadata'
import { AccountProfile, FullAccount } from '../types'

describe('profile-metadata utilities', () => {
  describe('parseProfileMetadata', () => {
    it('should parse valid posting_json_metadata', () => {
      const metadata = JSON.stringify({
        profile: {
          name: 'Test User',
          about: 'Test bio',
          profile_image: 'https://example.com/avatar.jpg',
          cover_image: 'https://example.com/cover.jpg',
          website: 'https://example.com',
          location: 'Test City'
        }
      })

      const result = parseProfileMetadata(metadata)

      expect(result.name).toBe('Test User')
      expect(result.about).toBe('Test bio')
      expect(result.profile_image).toBe('https://example.com/avatar.jpg')
    })

    it('should return empty object for null input', () => {
      const result = parseProfileMetadata(null)
      expect(result).toEqual({})
    })

    it('should return empty object for undefined input', () => {
      const result = parseProfileMetadata(undefined)
      expect(result).toEqual({})
    })

    it('should return empty object for empty string', () => {
      const result = parseProfileMetadata('')
      expect(result).toEqual({})
    })

    it('should return empty object for invalid JSON', () => {
      const result = parseProfileMetadata('invalid json')
      expect(result).toEqual({})
    })

    it('should return empty object if no profile field', () => {
      const metadata = JSON.stringify({ other: 'data' })
      const result = parseProfileMetadata(metadata)
      expect(result).toEqual({})
    })

    it('should return empty object if profile is not an object', () => {
      const metadata = JSON.stringify({ profile: 'string' })
      const result = parseProfileMetadata(metadata)
      expect(result).toEqual({})
    })

    it('should handle profile with tokens', () => {
      const metadata = JSON.stringify({
        profile: {
          name: 'Test User',
          tokens: [
            { chain: 'ethereum', address: '0x123' }
          ]
        }
      })

      const result = parseProfileMetadata(metadata)
      expect(result.name).toBe('Test User')
      expect(result.tokens).toEqual([{ chain: 'ethereum', address: '0x123' }])
    })
  })

  describe('extractAccountProfile', () => {
    it('should extract profile from account data', () => {
      const account = {
        posting_json_metadata: JSON.stringify({
          profile: {
            name: 'Test User',
            about: 'Bio'
          }
        })
      } as Pick<FullAccount, 'posting_json_metadata'>

      const result = extractAccountProfile(account)
      expect(result.name).toBe('Test User')
      expect(result.about).toBe('Bio')
    })

    it('should handle null account', () => {
      const result = extractAccountProfile(null)
      expect(result).toEqual({})
    })

    it('should handle undefined account', () => {
      const result = extractAccountProfile(undefined)
      expect(result).toEqual({})
    })
  })

  describe('buildProfileMetadata', () => {
    it('should build metadata from profile', () => {
      const result = buildProfileMetadata({
        profile: {
          name: 'New Name',
          about: 'New bio'
        }
      })

      expect(result.name).toBe('New Name')
      expect(result.about).toBe('New bio')
      expect(result.version).toBe(2)
    })

    it('should merge with existing profile', () => {
      const existingProfile: AccountProfile = {
        name: 'Old Name',
        about: 'Old bio',
        profile_image: 'old-image.jpg'
      } as unknown as AccountProfile

      const result = buildProfileMetadata({
        existingProfile,
        profile: {
          name: 'New Name'
        }
      })

      expect(result.name).toBe('New Name')
      expect(result.about).toBe('Old bio')
      expect(result.profile_image).toBe('old-image.jpg')
    })

    it('should handle tokens from profile', () => {
      const tokens: any = [
        { chain: 'ethereum', address: '0x123', meta: {} }
      ]

      const result = buildProfileMetadata({
        profile: {
          name: 'Test',
          tokens
        }
      })

      expect(result.tokens).toEqual(tokens)
    })

    it('should handle tokens as separate parameter', () => {
      const tokens: any = [
        { chain: 'bitcoin', address: 'bc1...', meta: {} }
      ]

      const result = buildProfileMetadata({
        profile: { name: 'Test' },
        tokens
      })

      expect(result.tokens).toEqual(tokens)
    })

    it('should sanitize sensitive data from tokens', () => {
      const tokens: any = [
        {
          chain: 'ethereum',
          address: '0x123',
          meta: {
            privateKey: 'secret',
            username: 'user',
            publicData: 'visible'
          } as any
        }
      ]

      const result = buildProfileMetadata({
        profile: { name: 'Test' },
        tokens
      })

      expect(result.tokens?.[0].meta).toBeDefined()
      expect(result.tokens?.[0].meta).not.toHaveProperty('privateKey')
      expect(result.tokens?.[0].meta).not.toHaveProperty('username')
      expect(result.tokens?.[0].meta).toHaveProperty('publicData')
    })

    it('should handle tokens with non-object meta', () => {
      const tokens: any = [
        { chain: 'ethereum', address: '0x123', meta: 'string' as any }
      ]

      const result = buildProfileMetadata({
        profile: { name: 'Test' },
        tokens
      })

      expect(result.tokens?.[0].meta).toBe('string')
    })

    it('should exclude version from profile updates', () => {
      const result = buildProfileMetadata({
        profile: {
          name: 'Test',
          version: 99 as any
        }
      })

      expect(result.version).toBe(2) // Always set to 2, not 99
    })

    it('should handle empty tokens array', () => {
      const result = buildProfileMetadata({
        profile: { name: 'Test' },
        tokens: []
      })

      expect(result.tokens).toEqual([])
    })

    it('should preserve tokens from existing profile when not updating', () => {
      const existingProfile: AccountProfile = {
        name: 'Test',
        tokens: [{ chain: 'ethereum', address: '0xabc' }]
      } as unknown as AccountProfile

      const result = buildProfileMetadata({
        existingProfile,
        profile: { about: 'New bio' }
      })

      expect(result.tokens).toBeDefined()
      expect(result.tokens).toHaveLength(1)
    })

    it('should deep merge nested profile data', () => {
      const existingProfile: AccountProfile = {
        name: 'Test',
        about: 'Bio',
        location: 'City1'
      } as unknown as AccountProfile

      const result = buildProfileMetadata({
        existingProfile,
        profile: {
          about: 'Updated Bio',
          website: 'https://example.com'
        }
      })

      expect(result.name).toBe('Test')
      expect(result.about).toBe('Updated Bio')
      expect(result.location).toBe('City1')
      expect(result.website).toBe('https://example.com')
    })
  })

  describe('parsePostingMetadataRoot', () => {
    it('should return the full root object including non-profile keys', () => {
      const metadata = JSON.stringify({
        profile: { name: 'Test User' },
        // sibling key that some other Hive app might store
        extra_app_data: { foo: 'bar' }
      })

      const result = parsePostingMetadataRoot(metadata)
      expect(result.profile).toEqual({ name: 'Test User' })
      expect(result.extra_app_data).toEqual({ foo: 'bar' })
    })

    it('should return empty object for null / undefined / empty / invalid input', () => {
      expect(parsePostingMetadataRoot(null)).toEqual({})
      expect(parsePostingMetadataRoot(undefined)).toEqual({})
      expect(parsePostingMetadataRoot('')).toEqual({})
      expect(parsePostingMetadataRoot('not json')).toEqual({})
    })

    it('should return empty object when root is not a plain object', () => {
      expect(parsePostingMetadataRoot(JSON.stringify(['a', 'b']))).toEqual({})
      expect(parsePostingMetadataRoot(JSON.stringify('string'))).toEqual({})
    })
  })

  describe('buildPostingJsonMetadata', () => {
    it('should preserve all existing profile fields on a partial update (pin regression)', () => {
      // Reproduces the "pin reset my avatar/details" incident: a partial update
      // that only sets `pinned` must NOT drop the rest of the profile.
      const existing = JSON.stringify({
        profile: {
          name: 'Melinda',
          about: 'Bio',
          cover_image: 'https://img/cover.jpg',
          profile_image: 'https://img/avatar.jpg',
          website: 'https://example.com',
          location: 'Wisconsin',
          tokens: [{ symbol: 'POB', type: 'ENGINE', meta: { show: true } }],
          version: 2
        }
      })

      const out = JSON.parse(
        buildPostingJsonMetadata({
          existingPostingJsonMetadata: existing,
          profile: { pinned: 'my-pinned-post' }
        })
      )

      expect(out.profile.pinned).toBe('my-pinned-post')
      expect(out.profile.name).toBe('Melinda')
      expect(out.profile.profile_image).toBe('https://img/avatar.jpg')
      expect(out.profile.cover_image).toBe('https://img/cover.jpg')
      expect(out.profile.about).toBe('Bio')
      expect(out.profile.website).toBe('https://example.com')
      expect(out.profile.location).toBe('Wisconsin')
      expect(out.profile.tokens).toHaveLength(1)
      expect(out.profile.version).toBe(2)
    })

    it('should preserve non-profile top-level sibling keys', () => {
      const existing = JSON.stringify({
        profile: { name: 'Old' },
        third_party: { keep: 'me' }
      })

      const out = JSON.parse(
        buildPostingJsonMetadata({
          existingPostingJsonMetadata: existing,
          profile: { name: 'New' }
        })
      )

      expect(out.profile.name).toBe('New')
      expect(out.third_party).toEqual({ keep: 'me' })
    })

    it('should always set profile version to 2', () => {
      const out = JSON.parse(
        buildPostingJsonMetadata({
          existingPostingJsonMetadata: JSON.stringify({ profile: { name: 'T' } }),
          profile: { about: 'b' }
        })
      )
      expect(out.profile.version).toBe(2)
    })

    it('should produce a valid profile when there is no existing metadata', () => {
      const out = JSON.parse(
        buildPostingJsonMetadata({
          existingPostingJsonMetadata: '',
          profile: { name: 'Fresh' }
        })
      )
      expect(out.profile.name).toBe('Fresh')
      expect(out.profile.version).toBe(2)
    })
  })
})
