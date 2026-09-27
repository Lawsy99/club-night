import { describe, expect, it } from 'vitest'
import { lastStoryLine } from './lastTime'

describe('last time', () => {
  it('is the last line of the latest story moment', () => {
    expect(lastStoryLine([])).toBeNull()
    expect(lastStoryLine(['wayout:c1', 'wayout:w3'])).toBe('Toby’s name is above yours. It’s dated the week before trial night.')
    expect(lastStoryLine(['wayout:w15'])).toBe('Dex: “Forty-one now. Don’t be rubbish.”')
    expect(lastStoryLine(['wayout:a2-9', 'study:prep'])).toContain('study')
  })

  it('skips moments that no longer exist', () => {
    expect(lastStoryLine(['wayout:w3', 'scene:gone'])).toContain('dated the week before')
  })
})
