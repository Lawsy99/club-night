// Placeholder portraits drawn in code (design document, "Placeholders, then
// final art"): one shared face, with hair, clothes and a cue or two per
// character from data/appearances.ts, and five expressions. Flat colour with
// dark outlines. Swapped for commissioned art later without touching callers.
import { useId } from 'react'
import { APPEARANCES, type Appearance } from '../data/appearances'
import type { Expression } from '../logic/dialogue'

const INK = '#1f2a24'
const STROKE = 1.6

type Props = {
  /** Character id (e.g. "marjorie", "pemberton", "neil"). */
  who: string
  expression?: Expression
  size?: number
  className?: string
}

export function Portrait({ who, expression = 'neutral', size = 44, className }: Props) {
  const clip = useId()
  const look = APPEARANCES[who]
  if (!look) {
    // Unknown speaker: a plain initial, as before.
    return (
      <span className={className} style={{ width: size, height: size }} aria-hidden="true">
        {who[0]?.toUpperCase()}
      </span>
    )
  }
  const head = look.child ? { cx: 50, cy: 49, rx: 16.5, ry: 19 } : { cx: 50, cy: 44, rx: 18, ry: 21 }
  const neckBase = head.cy + head.ry + 6
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ flex: `0 0 ${size}px` }}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`} strokeLinecap="round" strokeLinejoin="round">
        <rect width="100" height="100" fill={look.background} />
        <HairBehind look={look} head={head} />
        <Body look={look} head={head} neckBase={neckBase} />
        {/* Ears, then the head */}
        <ellipse cx={head.cx - head.rx} cy={head.cy + 2} rx="3.2" ry="4.5" fill={look.skin} stroke={INK} strokeWidth={STROKE} />
        <ellipse cx={head.cx + head.rx} cy={head.cy + 2} rx="3.2" ry="4.5" fill={look.skin} stroke={INK} strokeWidth={STROKE} />
        <ellipse cx={head.cx} cy={head.cy} rx={head.rx} ry={head.ry} fill={look.skin} stroke={INK} strokeWidth={STROKE} />
        <HairFront look={look} head={head} />
        <Face look={look} head={head} expression={expression} />
        <Extras look={look} head={head} neckBase={neckBase} />
      </g>
    </svg>
  )
}

type Head = { cx: number; cy: number; rx: number; ry: number }

/**
 * A symmetric curve from one side to the other only rises three quarters of
 * the way to its control points; this places them so the peak lands at `peak`.
 */
function arcControl(side: number, peak: number): number {
  return side - (side - peak) / 0.75
}

/** The hair's outline over the top of the head, ending at a hairline. */
function capPath({ cx, cy, rx, ry }: Head, lift = 0, hairlineDrop = 0): string {
  const side = cy + 2
  const top = arcControl(side, cy - ry - 2 - lift)
  const line = cy - ry * 0.42 + hairlineDrop
  const L = cx - rx
  const R = cx + rx
  return [
    `M${L - 1},${side}`,
    `C${L - 3},${top} ${R + 3},${top} ${R + 1},${side}`,
    `C${R - 1},${line} ${cx + rx * 0.5},${line - 3} ${cx},${line - 2}`,
    `C${cx - rx * 0.5},${line - 3} ${L + 1},${line} ${L - 1},${side}`,
    'Z',
  ].join(' ')
}

function HairBehind({ look, head }: { look: Appearance; head: Head }) {
  const { cx, cy, rx, ry } = head
  const top = cy - ry
  const fill = { fill: look.hair, stroke: INK, strokeWidth: STROKE }
  switch (look.hairStyle) {
    case 'bun':
      return <circle cx={cx} cy={top - 1} r="8" {...fill} />
    case 'ponytail':
      return (
        <path
          d={`M${cx + rx - 6},${top + 6} C${cx + rx + 14},${top + 10} ${cx + rx + 12},${cy + 18} ${cx + rx + 2},${cy + 26} C${cx + rx + 4},${cy + 10} ${cx + rx + 2},${cy - 4} ${cx + rx - 6},${top + 12} Z`}
          {...fill}
        />
      )
    case 'bob':
      return (
        <path
          d={`M${cx - rx - 3},${cy + 12} C${cx - rx - 5},${arcControl(cy + 12, top - 3)} ${cx + rx + 5},${arcControl(cy + 12, top - 3)} ${cx + rx + 3},${cy + 12} C${cx + rx - 2},${cy + 14} ${cx + rx - 2},${cy + 6} ${cx + rx - 3},${cy} L${cx - rx + 3},${cy} C${cx - rx + 2},${cy + 6} ${cx - rx + 2},${cy + 14} ${cx - rx - 3},${cy + 12} Z`}
          {...fill}
        />
      )
    default:
      return null
  }
}

function HairFront({ look, head }: { look: Appearance; head: Head }) {
  const { cx, cy, rx, ry } = head
  const top = cy - ry
  const fill = { fill: look.hair, stroke: INK, strokeWidth: STROKE }
  const L = cx - rx
  const R = cx + rx
  const tuft = (side: -1 | 1) => {
    const edge = cx + side * rx
    return `M${edge - side},${cy + 4} C${edge - side * 2},${cy - 8} ${edge + side * 1},${cy - 12} ${edge - side * 5},${cy - 13} L${edge - side * 5},${cy + 2} Z`
  }
  switch (look.hairStyle) {
    case 'messy': {
      const pts = [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const x = L - 1 + (i / 6) * (2 * rx + 2)
        const y = i % 2 === 0 ? top + 3 : top - 6
        return `L${x.toFixed(1)},${y}`
      })
      const line = cy - ry * 0.35
      return (
        <path
          d={`M${L - 1},${cy + 1} L${L - 2},${top + 8} ${pts.join(' ')} L${R + 2},${top + 8} L${R + 1},${cy + 1} C${R - 2},${line} ${cx + 6},${line - 4} ${cx},${line - 1} C${cx - 6},${line - 4} ${L + 2},${line} ${L - 1},${cy + 1} Z`}
          {...fill}
        />
      )
    }
    case 'neat': {
      const fringe = cy - ry * 0.35
      const ctrl = arcControl(cy + 2, top - 2)
      return (
        <path
          d={`M${L - 1},${cy + 2} C${L - 3},${ctrl} ${R + 3},${ctrl} ${R + 1},${cy + 2} L${R},${fringe} C${cx + 6},${fringe + 2} ${cx - 6},${fringe + 2} ${L},${fringe} Z`}
          {...fill}
        />
      )
    }
    case 'sides':
      return (
        <>
          <path d={tuft(-1)} {...fill} />
          <path d={tuft(1)} {...fill} />
        </>
      )
    case 'receding':
      return (
        <>
          <path d={tuft(-1)} {...fill} />
          <path d={tuft(1)} {...fill} />
          <path d={`M${cx - 6},${top + 3} C${cx - 2},${top - 1} ${cx + 4},${top} ${cx + 7},${top + 4}`} fill="none" stroke={look.hair} strokeWidth="3" />
        </>
      )
    case 'quiff':
      return (
        <>
          <path d={capPath(head, 5)} {...fill} />
          <path d={`M${cx - 6},${top} C${cx - 2},${top - 10} ${cx + 12},${top - 8} ${cx + 11},${top + 3}`} {...fill} />
        </>
      )
    case 'swept':
      return (
        <>
          <path d={capPath(head, 3, -2)} {...fill} />
          <path d={`M${cx - 9},${top + 7} C${cx - 4},${top + 1} ${cx + 6},${top} ${cx + 13},${top + 5}`} fill="none" stroke={INK} strokeWidth="1" opacity="0.5" />
        </>
      )
    case 'side-part':
      return (
        <>
          <path d={capPath(head, 1)} {...fill} />
          <path d={`M${cx - 7},${top} L${cx - 5},${top + 8}`} fill="none" stroke={INK} strokeWidth="1.2" />
        </>
      )
    default:
      // bun, ponytail, bob: a plain cap over the top (the rest is behind the head)
      return <path d={capPath(head)} {...fill} />
  }
}

function Body({ look, head, neckBase }: { look: Appearance; head: Head; neckBase: number }) {
  const { cx } = head
  const nb = neckBase
  const outline = { stroke: INK, strokeWidth: STROKE }
  const shirt = '#e7e3da'
  const bodyFill = look.clothes === 'tie' ? shirt : look.clothesColour
  const darker = shade(look.clothesColour, -0.25)
  return (
    <>
      {/* Neck, then shoulders */}
      <rect x={cx - 6.5} y={head.cy + head.ry - 7} width="13" height="14" fill={look.skin} {...outline} />
      <path d={`M6,100 C9,${nb + 10} 26,${nb} 50,${nb} C74,${nb} 91,${nb + 10} 94,100 Z`} fill={bodyFill} {...outline} />
      {look.clothes === 'cardigan' && (
        <>
          <path d={`M${cx - 9},${nb} L${cx},${nb + 15} L${cx + 9},${nb} Z`} fill="#efe6d8" {...outline} />
          <circle cx={cx} cy={nb + 19} r="1.4" fill={INK} />
          <circle cx={cx} cy={nb + 25} r="1.4" fill={INK} />
        </>
      )}
      {look.clothes === 'hoodie' && (
        <>
          <path d={`M${cx - 17},${nb + 3} C${cx - 15},${nb - 6} ${cx + 15},${nb - 6} ${cx + 17},${nb + 3}`} fill="none" stroke={darker} strokeWidth="4" />
          <path d={`M${cx - 4},${nb + 2} L${cx - 5},${nb + 16} M${cx + 4},${nb + 2} L${cx + 5},${nb + 16}`} stroke="#e7e3da" strokeWidth="1.4" />
        </>
      )}
      {look.clothes === 'jumper' && (
        <path d={`M${cx - 9},${nb} C${cx - 7},${nb + 6} ${cx + 7},${nb + 6} ${cx + 9},${nb}`} fill="none" stroke={darker} strokeWidth="3" />
      )}
      {(look.clothes === 'shirt' || look.clothes === 'tie' || look.clothes === 'polo') && (
        <>
          <path d={`M${cx - 9},${nb - 1} L${cx - 1},${nb + 7} L${cx - 5},${nb + 10} Z`} fill={look.clothes === 'polo' ? look.clothesColour : shade(bodyFill, 0.12)} {...outline} />
          <path d={`M${cx + 9},${nb - 1} L${cx + 1},${nb + 7} L${cx + 5},${nb + 10} Z`} fill={look.clothes === 'polo' ? look.clothesColour : shade(bodyFill, 0.12)} {...outline} />
        </>
      )}
      {look.clothes === 'tie' && (
        <path d={`M${cx - 2.5},${nb + 6} L${cx + 2.5},${nb + 6} L${cx + 4},${nb + 22} L${cx},${nb + 27} L${cx - 4},${nb + 22} Z`} fill={look.clothesColour} {...outline} />
      )}
      {look.clothes === 'quarter-zip' && (
        <>
          <path d={`M${cx - 10},${nb - 4} L${cx + 10},${nb - 4} L${cx + 11},${nb + 3} L${cx - 11},${nb + 3} Z`} fill={darker} {...outline} />
          <path d={`M${cx},${nb - 4} L${cx},${nb + 16}`} stroke="#c9ccd1" strokeWidth="1.6" />
          <rect x={cx - 1.5} y={nb + 14} width="3" height="5" rx="1" fill="#c9ccd1" />
        </>
      )}
      {look.clothes === 'blazer' && (
        <>
          <path d={`M${cx - 8},${nb} L${cx},${nb + 16} L${cx + 8},${nb} Z`} fill={shirt} {...outline} />
          <path d={`M${cx - 8},${nb} L${cx - 15},${nb + 24} L${cx - 2},${nb + 15} Z`} fill={darker} {...outline} />
          <path d={`M${cx + 8},${nb} L${cx + 15},${nb + 24} L${cx + 2},${nb + 15} Z`} fill={darker} {...outline} />
          <circle cx={cx} cy={nb + 4} r="3" fill="#b0873a" {...outline} />
        </>
      )}
      {look.clothes === 'polo-neck' && (
        <rect x={cx - 8} y={nb - 9} width="16" height="11" rx="3" fill={look.clothesColour} {...outline} />
      )}
    </>
  )
}

function Face({ look, head, expression }: { look: Appearance; head: Head; expression: Expression }) {
  const { cx, cy, rx, ry } = head
  const eyeY = cy + 1
  const dx = rx * 0.42
  const xL = cx - dx
  const xR = cx + dx
  const browY = cy - 6
  const my = cy + ry * 0.55
  const browColour = lightness(look.hair) > 0.7 ? '#7d766b' : look.hair
  const browWidth = look.extras.includes('bushy-brows') ? 3.4 : 2
  const brow = { fill: 'none', stroke: browColour, strokeWidth: browWidth }
  const line = { fill: 'none', stroke: INK, strokeWidth: STROKE }

  const brows = {
    neutral: [`M${xL - 4},${browY} L${xL + 4},${browY}`, `M${xR - 4},${browY} L${xR + 4},${browY}`],
    pleased: [`M${xL - 4},${browY} q4,-2.5 8,0`, `M${xR - 4},${browY} q4,-2.5 8,0`],
    annoyed: [`M${xL - 4},${browY - 2} L${xL + 4},${browY + 1.5}`, `M${xR - 4},${browY + 1.5} L${xR + 4},${browY - 2}`],
    surprised: [`M${xL - 4},${browY - 3} q4,-3 8,0`, `M${xR - 4},${browY - 3} q4,-3 8,0`],
    smug: [`M${xL - 4},${browY} L${xL + 4},${browY}`, `M${xR - 4},${browY - 2} q4,-3 8,0`],
  }[expression]

  const eye = (x: number) => {
    if (expression === 'smug') return <path key={x} d={`M${x - 3},${eyeY} q3,1.8 6,0`} {...line} />
    if (expression === 'surprised') return <circle key={x} cx={x} cy={eyeY} r="2.6" fill={INK} />
    if (expression === 'annoyed') return <ellipse key={x} cx={x} cy={eyeY + 0.3} rx="2" ry="1.4" fill={INK} />
    return <circle key={x} cx={x} cy={eyeY} r="1.9" fill={INK} />
  }

  let mouth: React.ReactNode
  if (expression === 'surprised') mouth = <ellipse cx={cx} cy={my + 1} rx="2.4" ry="3" fill={INK} />
  else {
    const d = {
      neutral: `M${cx - 5},${my} L${cx + 5},${my}`,
      pleased: `M${cx - 6},${my - 1} q6,6 12,0`,
      annoyed: look.tightSmile ? `M${cx - 5},${my} q5,1.6 10,0` : `M${cx - 5},${my + 1.5} q5,-3.5 10,0`,
      smug: `M${cx - 5},${my} q6,2.5 11,-2.5`,
    }[expression]
    mouth = <path d={d} {...line} />
  }

  return (
    <>
      <path d={brows[0]} {...brow} />
      <path d={brows[1]} {...brow} />
      {eye(xL)}
      {eye(xR)}
      <path d={`M${cx},${cy + 3} q-2,4 1,5`} {...line} strokeWidth="1.2" />
      {expression === 'pleased' && (
        <>
          <circle cx={xL - 2} cy={my - 4} r="2.6" fill="#e39a86" opacity="0.45" />
          <circle cx={xR + 2} cy={my - 4} r="2.6" fill="#e39a86" opacity="0.45" />
        </>
      )}
      {mouth}
    </>
  )
}

function Extras({ look, head, neckBase }: { look: Appearance; head: Head; neckBase: number }) {
  const { cx, cy, rx, ry } = head
  const eyeY = cy + 1
  const dx = rx * 0.42
  const out = { fill: 'none', stroke: INK, strokeWidth: STROKE }
  return (
    <>
      {look.extras.map((extra) => {
        switch (extra) {
          case 'glasses-chain':
          case 'glasses-square':
            return (
              <g key={extra}>
                <rect x={cx - dx - 5} y={eyeY - 3.6} width="10" height="7.2" rx="2" {...out} />
                <rect x={cx + dx - 5} y={eyeY - 3.6} width="10" height="7.2" rx="2" {...out} />
                <path d={`M${cx - dx + 5},${eyeY - 1} L${cx + dx - 5},${eyeY - 1}`} {...out} />
                {extra === 'glasses-chain' && (
                  <path
                    d={`M${cx - dx - 5},${eyeY} C${cx - rx - 6},${eyeY + 16} ${cx - 16},${neckBase + 2} ${cx - 10},${neckBase + 6} M${cx + dx + 5},${eyeY} C${cx + rx + 6},${eyeY + 16} ${cx + 16},${neckBase + 2} ${cx + 10},${neckBase + 6}`}
                    fill="none"
                    stroke="#b0873a"
                    strokeWidth="1"
                    strokeDasharray="1.5 1.5"
                  />
                )}
              </g>
            )
          case 'glasses-round':
            return (
              <g key={extra}>
                <circle cx={cx - dx} cy={eyeY} r="5" {...out} />
                <circle cx={cx + dx} cy={eyeY} r="5" {...out} />
                <path d={`M${cx - dx + 5},${eyeY - 0.5} q${dx - 5},-2 ${2 * (dx - 5)},0`} {...out} />
              </g>
            )
          case 'moustache':
            return (
              <path
                key={extra}
                d={`M${cx - 8},${cy + ry * 0.42} C${cx - 4},${cy + ry * 0.3} ${cx + 4},${cy + ry * 0.3} ${cx + 8},${cy + ry * 0.42} C${cx + 4},${cy + ry * 0.45} ${cx - 4},${cy + ry * 0.45} ${cx - 8},${cy + ry * 0.42} Z`}
                fill={look.hair}
                stroke={INK}
                strokeWidth="1.2"
              />
            )
          case 'headphones':
            return (
              <g key={extra}>
                <path
                  d={`M${cx - 15},${neckBase - 1} C${cx - 15},${neckBase + 9} ${cx + 15},${neckBase + 9} ${cx + 15},${neckBase - 1}`}
                  fill="none"
                  stroke="#2b2b2b"
                  strokeWidth="3"
                />
                <ellipse cx={cx - 15} cy={neckBase - 1} rx="4" ry="5" fill="#b8574f" stroke={INK} strokeWidth={STROKE} />
                <ellipse cx={cx + 15} cy={neckBase - 1} rx="4" ry="5" fill="#b8574f" stroke={INK} strokeWidth={STROKE} />
              </g>
            )
          default:
            return null
        }
      })}
    </>
  )
}

/** 0 (black) to 1 (white), from a #rrggbb colour. */
function lightness(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255
}

/** A colour made lighter (amount > 0) or darker (amount < 0). */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const channel = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
  const r = channel((n >> 16) & 255)
  const g = channel((n >> 8) & 255)
  const b = channel(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
