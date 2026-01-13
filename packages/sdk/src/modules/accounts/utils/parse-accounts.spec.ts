import { describe, it, expect } from 'vitest'
import { parseAccounts } from './parse-accounts'

describe('parseAccounts', () => {
  describe('with valid account data', () => {
    it('should parse single account with posting_json_metadata', () => {
      const rawAccount = {
        name: 'testuser',
        owner: { weight_threshold: 1 },
        active: { weight_threshold: 1 },
        posting: { weight_threshold: 1 },
        memo_key: 'STM123...',
        post_count: 100,
        created: '2020-01-01T00:00:00',
        reputation: 25,
        posting_json_metadata: JSON.stringify({
          profile: {
            name: 'Test User',
            about: 'Test bio',
            profile_image: 'https://example.com/avatar.jpg',
            cover_image: 'https://example.com/cover.jpg',
            website: 'https://example.com',
            location: 'Test City'
          }
        }),
        json_metadata: '{}',
        last_vote_time: '2024-01-01T00:00:00',
        last_post: '2024-01-01T00:00:00',
        reward_hive_balance: '0.000 HIVE',
        reward_hbd_balance: '0.000 HBD',
        reward_vesting_hive: '0.000 HIVE',
        reward_vesting_balance: '0.000000 VESTS',
        balance: '100.000 HIVE',
        hbd_balance: '50.000 HBD',
        savings_balance: '10.000 HIVE',
        savings_hbd_balance: '5.000 HBD',
        savings_hbd_last_interest_payment: '2024-01-01T00:00:00',
        savings_hbd_seconds_last_update: '2024-01-01T00:00:00',
        savings_hbd_seconds: '0',
        next_vesting_withdrawal: '1969-12-31T23:59:59',
        pending_claimed_accounts: 0,
        vesting_shares: '1000000.000000 VESTS',
        delegated_vesting_shares: '100000.000000 VESTS',
        received_vesting_shares: '50000.000000 VESTS',
        vesting_withdraw_rate: '0.000000 VESTS',
        to_withdraw: 0,
        withdrawn: 0,
        witness_votes: ['witness1'],
        proxy: '',
        recovery_account: 'steem',
        proxied_vsf_votes: [0, 0, 0, 0],
        voting_manabar: { current_mana: 10000, last_update_time: 1234567890 },
        voting_power: 10000,
        downvote_manabar: { current_mana: 2500, last_update_time: 1234567890 }
      }

      const result = parseAccounts([rawAccount])

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('testuser')
      expect(result[0].profile).toBeDefined()
      expect(result[0].profile.name).toBe('Test User')
      expect(result[0].profile.about).toBe('Test bio')
      expect(result[0].profile.profile_image).toBe('https://example.com/avatar.jpg')
    })

    it('should fallback to json_metadata if posting_json_metadata has no profile', () => {
      const rawAccount = {
        name: 'testuser',
        posting_json_metadata: '{}',
        json_metadata: JSON.stringify({
          profile: {
            name: 'Fallback Name',
            about: 'Fallback bio'
          }
        }),
        balance: '100.000 HIVE',
        vesting_shares: '1000000.000000 VESTS'
      }

      const result = parseAccounts([rawAccount] as any)

      expect(result[0].profile).toBeDefined()
      expect(result[0].profile.name).toBe('Fallback Name')
      expect(result[0].profile.about).toBe('Fallback bio')
    })

    it('should use empty profile if no metadata available', () => {
      const rawAccount = {
        name: 'testuser',
        posting_json_metadata: '',
        json_metadata: '',
        balance: '100.000 HIVE',
        vesting_shares: '1000000.000000 VESTS'
      }

      const result = parseAccounts([rawAccount] as any)

      expect(result[0].profile).toBeDefined()
      expect(result[0].profile.name).toBe('')
      expect(result[0].profile.about).toBe('')
      expect(result[0].profile.profile_image).toBe('')
      expect(result[0].profile.cover_image).toBe('')
      expect(result[0].profile.website).toBe('')
      expect(result[0].profile.location).toBe('')
    })

    it('should handle invalid JSON in metadata gracefully', () => {
      const rawAccount = {
        name: 'testuser',
        posting_json_metadata: 'invalid json',
        json_metadata: 'also invalid',
        balance: '100.000 HIVE',
        vesting_shares: '1000000.000000 VESTS'
      }

      const result = parseAccounts([rawAccount] as any)

      expect(result[0].profile).toBeDefined()
      expect(result[0].profile.name).toBe('')
    })

    it('should parse multiple accounts', () => {
      const rawAccounts = [
        {
          name: 'user1',
          posting_json_metadata: JSON.stringify({
            profile: { name: 'User One' }
          }),
          balance: '100.000 HIVE',
          vesting_shares: '1000000.000000 VESTS'
        },
        {
          name: 'user2',
          posting_json_metadata: JSON.stringify({
            profile: { name: 'User Two' }
          }),
          balance: '200.000 HIVE',
          vesting_shares: '2000000.000000 VESTS'
        },
        {
          name: 'user3',
          posting_json_metadata: JSON.stringify({
            profile: { name: 'User Three' }
          }),
          balance: '300.000 HIVE',
          vesting_shares: '3000000.000000 VESTS'
        }
      ]

      const result = parseAccounts(rawAccounts as any)

      expect(result).toHaveLength(3)
      expect(result[0].profile.name).toBe('User One')
      expect(result[1].profile.name).toBe('User Two')
      expect(result[2].profile.name).toBe('User Three')
    })
  })

  describe('with edge cases', () => {
    it('should handle empty array', () => {
      const result = parseAccounts([])
      expect(result).toEqual([])
    })

    it('should handle null profile in posting_json_metadata', () => {
      const rawAccount = {
        name: 'testuser',
        posting_json_metadata: JSON.stringify({ profile: null }),
        json_metadata: '{}',
        balance: '100.000 HIVE',
        vesting_shares: '1000000.000000 VESTS'
      }

      const result = parseAccounts([rawAccount] as any)

      expect(result[0].profile).toBeDefined()
      expect(result[0].profile.name).toBe('')
    })

    it('should preserve all account fields', () => {
      const rawAccount = {
        name: 'testuser',
        owner: { weight_threshold: 1 },
        active: { weight_threshold: 1 },
        posting: { weight_threshold: 1 },
        memo_key: 'STM123',
        post_count: 42,
        created: '2020-01-01',
        reputation: 70,
        posting_json_metadata: '{}',
        json_metadata: '{}',
        last_vote_time: '2024-01-01',
        last_post: '2024-01-02',
        reward_hive_balance: '1.000 HIVE',
        reward_hbd_balance: '2.000 HBD',
        reward_vesting_hive: '3.000 HIVE',
        reward_vesting_balance: '4.000000 VESTS',
        balance: '100.000 HIVE',
        hbd_balance: '50.000 HBD',
        savings_balance: '10.000 HIVE',
        savings_hbd_balance: '5.000 HBD',
        savings_hbd_last_interest_payment: '2024-01-01',
        savings_hbd_seconds_last_update: '2024-01-01',
        savings_hbd_seconds: '123456',
        next_vesting_withdrawal: '2024-06-01',
        pending_claimed_accounts: 5,
        vesting_shares: '1000000.000000 VESTS',
        delegated_vesting_shares: '100000.000000 VESTS',
        received_vesting_shares: '50000.000000 VESTS',
        vesting_withdraw_rate: '5000.000000 VESTS',
        to_withdraw: 50000,
        withdrawn: 25000,
        witness_votes: ['witness1', 'witness2'],
        proxy: 'proxyuser',
        recovery_account: 'recoveryuser',
        proxied_vsf_votes: [1, 2, 3, 4],
        voting_manabar: { current_mana: 8000, last_update_time: 1234567890 },
        voting_power: 8000,
        downvote_manabar: { current_mana: 2000, last_update_time: 1234567890 }
      }

      const result = parseAccounts([rawAccount])

      expect(result[0].post_count).toBe(42)
      expect(result[0].reputation).toBe(70)
      expect(result[0].balance).toBe('100.000 HIVE')
      expect(result[0].vesting_shares).toBe('1000000.000000 VESTS')
      expect(result[0].witness_votes).toEqual(['witness1', 'witness2'])
      expect(result[0].pending_claimed_accounts).toBe(5)
    })
  })
})
