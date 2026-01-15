import { describe, it, expect } from 'vitest'
import {
  parseProfileMetadata,
  extractAccountProfile,
  buildProfileMetadata,
  ProfileTokens
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
      } as AccountProfile

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
      const tokens: ProfileTokens = [
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
      const tokens: ProfileTokens = [
        { chain: 'bitcoin', address: 'bc1...', meta: {} }
      ]

      const result = buildProfileMetadata({
        profile: { name: 'Test' },
        tokens
      })

      expect(result.tokens).toEqual(tokens)
    })

    it('should sanitize sensitive data from tokens', () => {
      const tokens: ProfileTokens = [
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
      const tokens: ProfileTokens = [
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

      expect(result.tokens).toBeUndefined()
    })

    it('should preserve tokens from existing profile when not updating', () => {
      const existingProfile: AccountProfile = {
        name: 'Test',
        tokens: [{ chain: 'ethereum', address: '0xabc' }]
      } as AccountProfile

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
      } as AccountProfile

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
})
