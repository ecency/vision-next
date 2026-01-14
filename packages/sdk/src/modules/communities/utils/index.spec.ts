import { describe, it, expect } from 'vitest'
import { getCommunityType, getCommunityPermissions } from './index'
import { ROLES } from '../types'

describe('communities utilities', () => {
  describe('getCommunityType', () => {
    describe('Council type', () => {
      it('should return Council for hive-3 prefix', () => {
        expect(getCommunityType('hive-3', 0)).toBe('Council')
      })

      it('should return Council for hive-3xxxxx', () => {
        expect(getCommunityType('hive-312345', 0)).toBe('Council')
      })

      it('should return Council for type_id 3', () => {
        expect(getCommunityType('hive-123456', 3)).toBe('Council')
      })

      it('should prioritize name prefix over type_id', () => {
        expect(getCommunityType('hive-3', 1)).toBe('Council')
      })
    })

    describe('Journal type', () => {
      it('should return Journal for hive-2 prefix', () => {
        expect(getCommunityType('hive-2', 0)).toBe('Journal')
      })

      it('should return Journal for hive-2xxxxx', () => {
        expect(getCommunityType('hive-212345', 0)).toBe('Journal')
      })

      it('should return Journal for type_id 2', () => {
        expect(getCommunityType('hive-123456', 2)).toBe('Journal')
      })
    })

    describe('Topic type', () => {
      it('should return Topic for hive-1 prefix', () => {
        expect(getCommunityType('hive-1', 0)).toBe('Topic')
      })

      it('should return Topic for regular community', () => {
        expect(getCommunityType('hive-123456', 0)).toBe('Topic')
      })

      it('should return Topic for type_id 1', () => {
        expect(getCommunityType('hive-123456', 1)).toBe('Topic')
      })

      it('should return Topic as default', () => {
        expect(getCommunityType('hive-999999', 0)).toBe('Topic')
      })
    })
  })

  describe('getCommunityPermissions', () => {
    describe('Topic community permissions', () => {
      const communityType = 'Topic' as const

      it('should allow posting for guest users', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.GUEST,
          subscribed: false
        })
        expect(perms.canPost).toBe(true)
        expect(perms.canComment).toBe(true)
        expect(perms.isModerator).toBe(false)
      })

      it('should allow posting for members', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.MEMBER,
          subscribed: false
        })
        expect(perms.canPost).toBe(true)
        expect(perms.canComment).toBe(true)
      })

      it('should deny posting for muted users', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.MUTED,
          subscribed: false
        })
        expect(perms.canPost).toBe(false)
        expect(perms.canComment).toBe(false)
      })

      it('should grant moderator status to owner', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.OWNER,
          subscribed: false
        })
        expect(perms.isModerator).toBe(true)
      })

      it('should grant moderator status to admin', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.ADMIN,
          subscribed: false
        })
        expect(perms.isModerator).toBe(true)
      })

      it('should grant moderator status to mod', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.MOD,
          subscribed: false
        })
        expect(perms.isModerator).toBe(true)
      })
    })

    describe('Journal community permissions', () => {
      const communityType = 'Journal' as const

      it('should allow posting for members', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.MEMBER,
          subscribed: false
        })
        expect(perms.canPost).toBe(true)
        expect(perms.canComment).toBe(true)
      })

      it('should deny posting for guest users', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.GUEST,
          subscribed: false
        })
        expect(perms.canPost).toBe(false)
      })

      it('should allow commenting for subscribed guests', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.GUEST,
          subscribed: true
        })
        expect(perms.canPost).toBe(false)
        expect(perms.canComment).toBe(true)
      })

      it('should deny commenting for unsubscribed guests', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.GUEST,
          subscribed: false
        })
        expect(perms.canComment).toBe(false)
      })

      it('should allow posting for moderators', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.MOD,
          subscribed: false
        })
        expect(perms.canPost).toBe(true)
        expect(perms.canComment).toBe(true)
        expect(perms.isModerator).toBe(true)
      })

      it('should deny all actions for muted users', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.MUTED,
          subscribed: true
        })
        expect(perms.canPost).toBe(false)
        expect(perms.canComment).toBe(false)
      })
    })

    describe('Council community permissions', () => {
      const communityType = 'Council' as const

      it('should allow posting for members', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.MEMBER,
          subscribed: false
        })
        expect(perms.canPost).toBe(true)
        expect(perms.canComment).toBe(true)
      })

      it('should deny posting for guest users', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.GUEST,
          subscribed: false
        })
        expect(perms.canPost).toBe(false)
        expect(perms.canComment).toBe(false)
      })

      it('should deny commenting for guests even if subscribed', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.GUEST,
          subscribed: true
        })
        expect(perms.canPost).toBe(false)
        expect(perms.canComment).toBe(false)
      })

      it('should allow posting for owner', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.OWNER,
          subscribed: false
        })
        expect(perms.canPost).toBe(true)
        expect(perms.canComment).toBe(true)
        expect(perms.isModerator).toBe(true)
      })

      it('should allow posting for admin', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.ADMIN,
          subscribed: false
        })
        expect(perms.canPost).toBe(true)
        expect(perms.canComment).toBe(true)
        expect(perms.isModerator).toBe(true)
      })

      it('should deny all actions for muted users', () => {
        const perms = getCommunityPermissions({
          communityType,
          userRole: ROLES.MUTED,
          subscribed: true
        })
        expect(perms.canPost).toBe(false)
        expect(perms.canComment).toBe(false)
        expect(perms.isModerator).toBe(false)
      })
    })

    describe('permission snapshots', () => {
      it('should match snapshot for all role/type combinations', () => {
        const roles = [ROLES.GUEST, ROLES.MEMBER, ROLES.MOD, ROLES.ADMIN, ROLES.OWNER, ROLES.MUTED]
        const types = ['Topic', 'Journal', 'Council'] as const
        const subscriptionStates = [false, true]

        const allPermissions = roles.flatMap(userRole =>
          types.flatMap(communityType =>
            subscriptionStates.map(subscribed => ({
              userRole,
              communityType,
              subscribed,
              permissions: getCommunityPermissions({ communityType, userRole, subscribed })
            }))
          )
        )

        expect(allPermissions).toMatchSnapshot()
      })
    })
  })
})
