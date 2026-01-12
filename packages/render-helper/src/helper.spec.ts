import { makeEntryCacheKey } from './helper'

describe('Helper', () => {
  it('1- makeEntryCacheKey', () => {
    const input = {
      author: 'foo1',
      permlink: 'bar1',
      last_update: '2019-05-10T09:15:21',
      updated: ''
    }

    const expected = 'foo1-bar1-2019-05-10T09:15:21-'

    expect(makeEntryCacheKey(input)).toBe(expected)
  })
})
