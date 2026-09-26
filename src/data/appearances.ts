// How each character looks in their placeholder portrait (design document,
// "Characters and art": head and shoulders, one or two strong cues each,
// muted colours). Drawn in code by components/Portrait.tsx until the
// commissioned art arrives; only this file and that one change then.
import type { Expression } from '../logic/dialogue'

export type HairStyle = 'bun' | 'messy' | 'neat' | 'sides' | 'ponytail' | 'side-part' | 'quiff' | 'swept' | 'receding' | 'bob'
export type Clothes = 'cardigan' | 'hoodie' | 'jumper' | 'shirt' | 'tie' | 'quarter-zip' | 'blazer' | 'polo-neck' | 'polo'
export type Extra = 'glasses-chain' | 'glasses-round' | 'glasses-square' | 'moustache' | 'headphones' | 'bushy-brows'

export type Appearance = {
  /** Circle behind the portrait. */
  background: string
  skin: string
  hair: string
  hairStyle: HairStyle
  clothes: Clothes
  clothesColour: string
  extras: Extra[]
  /** Oscar is eleven: a smaller head, lower down. */
  child?: boolean
  /** Toby's "annoyed" is a tight smile (design document, "Expression sets"). */
  tightSmile?: boolean
  /** How they look while clearly winning, and clearly losing (neutral in between). */
  moods?: { winning: Expression; losing: Expression }
}

export const APPEARANCES: Record<string, Appearance> = {
  marjorie: {
    background: '#b9a38f',
    skin: '#f0d3bd',
    hair: '#d9d6cf',
    hairStyle: 'bun',
    clothes: 'cardigan',
    clothesColour: '#a86a6f',
    extras: ['glasses-chain'],
    moods: { winning: 'pleased', losing: 'annoyed' },
  },
  dex: {
    background: '#7f9c96',
    skin: '#b98563',
    hair: '#2b2320',
    hairStyle: 'messy',
    clothes: 'hoodie',
    clothesColour: '#4f6f78',
    extras: ['headphones'],
    moods: { winning: 'smug', losing: 'annoyed' },
  },
  oscar: {
    background: '#a9b98f',
    skin: '#f3d6c2',
    hair: '#8a5a33',
    hairStyle: 'neat',
    clothes: 'jumper',
    clothesColour: '#34466a',
    extras: [],
    child: true,
    moods: { winning: 'pleased', losing: 'annoyed' },
  },
  neil: {
    background: '#9fa7b3',
    skin: '#eccab2',
    hair: '#6e5a48',
    hairStyle: 'receding',
    clothes: 'polo',
    clothesColour: '#6b8a5c',
    extras: [],
  },
  clive: {
    background: '#a6a28d',
    skin: '#eac8ae',
    hair: '#b7b2a6',
    hairStyle: 'sides',
    clothes: 'shirt',
    clothesColour: '#c2ad84',
    extras: ['moustache'],
    // Never excited, never rattled.
    moods: { winning: 'pleased', losing: 'neutral' },
  },
  priya: {
    background: '#c2a66b',
    skin: '#a8714f',
    hair: '#1f1a1a',
    hairStyle: 'ponytail',
    clothes: 'jumper',
    clothesColour: '#c79a3b',
    extras: ['glasses-round'],
    moods: { winning: 'pleased', losing: 'surprised' },
  },
  graham: {
    background: '#8f9aa8',
    skin: '#efcfb6',
    hair: '#5a4a3c',
    hairStyle: 'side-part',
    clothes: 'tie',
    clothesColour: '#7a2f38',
    extras: ['glasses-square'],
    moods: { winning: 'smug', losing: 'annoyed' },
  },
  toby: {
    background: '#8fa7b8',
    skin: '#f2d2b8',
    hair: '#c9a266',
    hairStyle: 'quiff',
    clothes: 'quarter-zip',
    clothesColour: '#2f3d5c',
    extras: [],
    tightSmile: true,
    moods: { winning: 'smug', losing: 'annoyed' },
  },
  pemberton: {
    background: '#9a8f7c',
    skin: '#e6b79e',
    hair: '#eeebe4',
    hairStyle: 'swept',
    clothes: 'blazer',
    clothesColour: '#3f4a3c',
    extras: ['bushy-brows'],
  },
  // Background members (data/members.ts)
  malcolm: {
    background: '#8c8a9c',
    skin: '#e9c7ad',
    hair: '#9c9790',
    hairStyle: 'side-part',
    clothes: 'blazer',
    clothesColour: '#2f3440',
    extras: ['glasses-square'],
  },
  ray: {
    background: '#9ba58c',
    skin: '#d9a987',
    hair: '#4a3b30',
    hairStyle: 'receding',
    clothes: 'polo',
    clothesColour: '#8a3f3a',
    extras: ['moustache'],
  },
  sheila: {
    background: '#b39a9a',
    skin: '#f2d4c2',
    hair: '#b0603a',
    hairStyle: 'bob',
    clothes: 'cardigan',
    clothesColour: '#5f7a6a',
    extras: [],
  },
  bill: {
    background: '#a39e8e',
    skin: '#ecc9b0',
    hair: '#e6e3dc',
    hairStyle: 'sides',
    clothes: 'shirt',
    clothesColour: '#8fa1b5',
    extras: ['glasses-round'],
  },
  vera: {
    background: '#7c8290',
    skin: '#efd2c0',
    hair: '#c7c9cc',
    hairStyle: 'bob',
    clothes: 'polo-neck',
    clothesColour: '#2a2a2e',
    extras: [],
    // Her range is deliberately small.
    moods: { winning: 'neutral', losing: 'neutral' },
  },
}
