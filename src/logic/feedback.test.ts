import { describe, expect, it } from 'vitest'
import { composeFeedback, describeDevice } from './feedback'

describe('tester feedback', () => {
  it('adds the details needed to find a bug', () => {
    const text = composeFeedback('The knight lesson froze', { version: '27 Sept, 10:00', whereTheyAre: 'Week 3, rating 1180', device: 'iOS 18.1, Safari' })
    expect(text).toContain('The knight lesson froze')
    expect(text).toContain('Version: 27 Sept, 10:00')
    expect(text).toContain('Where: Week 3, rating 1180')
  })

  it('describes the phone', () => {
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
    expect(describeDevice(iphone, true)).toBe('iOS 18.1, Safari, home screen app')
    const android = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'
    expect(describeDevice(android, false)).toBe('Android 14, Chrome')
  })
})
