// The cutscene pictures: one place each, drawn simply in the club's colours
// (placeholders in the same spirit as the portraits, until commissioned art).
// Places, not faces: the lines under the picture carry the people.
import type { ReactElement } from 'react'
import type { SceneArt as SceneId } from '../data/cutscenes'

const INK = '#16301f'
const BUFF = '#efe6c8'
const BRASS = '#d0a847'
const WOOD = '#6b4a2e'

export function SceneArt({ scene }: { scene: SceneId }) {
  return (
    <svg className="scene-art" viewBox="0 0 320 200" role="img" aria-label={LABELS[scene]}>
      {SCENES[scene]()}
    </svg>
  )
}

const LABELS: Record<SceneId, string> = {
  'club-room': 'The club room at night, chairs up on the tables',
  'car-park': 'A car in the pub car park at night, in the rain',
  'honours-board': 'The club honours board',
  noticeboard: 'The club noticeboard',
}

const SCENES: Record<SceneId, () => ReactElement> = {
  'club-room': () => (
    <>
      <rect width="320" height="200" fill="#1c3527" />
      {/* Window: night outside */}
      <rect x="22" y="22" width="62" height="74" fill="#0d1a24" stroke={BUFF} strokeOpacity="0.5" strokeWidth="2" />
      <line x1="53" y1="22" x2="53" y2="96" stroke={BUFF} strokeOpacity="0.5" strokeWidth="1.5" />
      <line x1="22" y1="59" x2="84" y2="59" stroke={BUFF} strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="70" cy="36" r="5" fill={BUFF} opacity="0.7" />
      {/* One light left on */}
      <line x1="210" y1="0" x2="210" y2="44" stroke={BUFF} strokeOpacity="0.4" />
      <path d="M198 44 h24 l6 12 h-36 z" fill={BRASS} />
      <ellipse cx="210" cy="120" rx="95" ry="60" fill={BRASS} opacity="0.08" />
      {/* Floor */}
      <rect y="150" width="320" height="50" fill="#132519" />
      {/* Tables, boards, chairs up */}
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${110 + i * 110} 0)`}>
          <rect x="-40" y="128" width="84" height="7" fill={WOOD} />
          <rect x="-36" y="135" width="4" height="22" fill={WOOD} />
          <rect x="36" y="135" width="4" height="22" fill={WOOD} />
          {i === 0 ? (
            <>
              <path d="M-26 128 v-18 h14 v18 M-26 116 h14" stroke={BUFF} strokeOpacity="0.35" strokeWidth="2" fill="none" />
              <path d="M12 128 v-18 h14 v18 M12 116 h14" stroke={BUFF} strokeOpacity="0.35" strokeWidth="2" fill="none" />
            </>
          ) : (
            <Board x={-14} y={123} />
          )}
        </g>
      ))}
      {/* The one chair still out */}
      <path d="M260 144 v32 M260 162 h20 v14" stroke={BRASS} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </>
  ),

  'car-park': () => (
    <>
      <rect width="320" height="200" fill="#0e1b24" />
      {/* The pub, and its sign */}
      <rect x="0" y="40" width="96" height="120" fill="#172a22" />
      <rect x="18" y="60" width="22" height="28" fill={BRASS} opacity="0.35" />
      <rect x="54" y="60" width="22" height="28" fill={BRASS} opacity="0.2" />
      <rect x="100" y="52" width="46" height="18" fill={INK} stroke={BRASS} strokeWidth="1" />
      <text x="123" y="64" textAnchor="middle" fontSize="7" fill={BRASS} fontFamily="serif">RED LION</text>
      {/* Street lamp */}
      <line x1="262" y1="40" x2="262" y2="160" stroke="#3b4a44" strokeWidth="3" />
      <circle cx="262" cy="40" r="5" fill={BUFF} />
      <ellipse cx="262" cy="120" rx="40" ry="70" fill={BUFF} opacity="0.06" />
      {/* Ground and bay lines */}
      <rect y="160" width="320" height="40" fill="#101915" />
      {[130, 200, 270].map((x) => (
        <line key={x} x1={x} y1="166" x2={x - 14} y2="196" stroke={BUFF} strokeOpacity="0.2" strokeWidth="2" />
      ))}
      {/* The car, and the phone lit up inside */}
      <path d="M140 162 h110 v-18 l-18 -4 l-16 -18 h-46 l-18 18 l-12 4 z" fill="#22323a" />
      <path d="M166 142 l12 -14 h24 v14 z" fill="#0b1419" />
      <path d="M206 128 h8 l12 14 h-20 z" fill="#0b1419" />
      <rect x="192" y="134" width="6" height="9" rx="1" fill={BUFF} />
      <circle cx="195" cy="138" r="12" fill={BUFF} opacity="0.12" />
      <circle cx="160" cy="164" r="9" fill="#0a1014" />
      <circle cx="230" cy="164" r="9" fill="#0a1014" />
      {/* Rain */}
      {Array.from({ length: 40 }, (_, i) => {
        const x = (i * 53) % 330
        const y = (i * 37) % 170
        return <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 12} stroke={BUFF} strokeOpacity="0.18" />
      })}
    </>
  ),

  'honours-board': () => (
    <>
      <rect width="320" height="200" fill="#1c3527" />
      {/* Panelling */}
      {[0, 80, 160, 240].map((x) => (
        <rect key={x} x={x + 6} y="150" width="68" height="44" fill="none" stroke={BUFF} strokeOpacity="0.08" />
      ))}
      <rect x="70" y="12" width="180" height="176" fill="#4a2f1b" stroke={BRASS} strokeWidth="3" />
      <text x="160" y="32" textAnchor="middle" fontSize="11" fill={BRASS} fontFamily="serif" letterSpacing="2">
        CLUB CHAMPIONS
      </text>
      {HONOURS.map(([year, name], i) => (
        <g key={year} fontFamily="serif" fontSize="8" fill={BRASS} opacity={name === 'V. HART' ? 1 : 0.65}>
          <text x="96" y={50 + i * 10}>{year}</text>
          <text x="226" y={50 + i * 10} textAnchor="end">{name}</text>
        </g>
      ))}
      {/* A duster, left on the frame */}
      <path d="M244 176 q10 -8 22 -2 q-4 10 -18 10 z" fill={BUFF} opacity="0.8" />
    </>
  ),

  noticeboard: () => (
    <>
      <rect width="320" height="200" fill="#1c3527" />
      <rect x="30" y="18" width="260" height="164" fill="#a9824f" stroke={WOOD} strokeWidth="6" />
      {/* Old notices, a little crooked */}
      <Sheet x={48} y={34} w={62} h={78} rotate={-4} />
      <Sheet x={214} y={40} w={58} h={52} rotate={3} />
      <Sheet x={210} y={104} w={62} h={58} rotate={-2} />
      <Sheet x={50} y={124} w={56} h={44} rotate={2} />
      {/* The new one: crisp, straight, in the middle */}
      <rect x="124" y="30" width="76" height="140" fill="#fbf8ef" />
      <circle cx="162" cy="34" r="3" fill={BRASS} />
      <text x="162" y="52" textAnchor="middle" fontSize="8" fontFamily="serif" fill={INK} letterSpacing="1">
        CLUB LADDER
      </text>
      <text x="134" y="68" fontSize="7" fontFamily="serif" fill={INK}>1.</text>
      <rect x="144" y="63" width="44" height="5" fill={INK} />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <text x="134" y={82 + i * 11} fontSize="7" fontFamily="serif" fill={INK} opacity="0.5">
            {i + 2}.
          </text>
          <line x1="144" y1={80 + i * 11} x2="186" y2={80 + i * 11} stroke={INK} strokeOpacity="0.2" />
        </g>
      ))}
    </>
  ),
}

/** Club champions, year after year: one name ten years running, then it stops. */
const HONOURS: [string, string][] = [
  ['1996', 'V. HART'],
  ['1997', 'V. HART'],
  ['1998', 'V. HART'],
  ['1999', 'V. HART'],
  ['2000', 'V. HART'],
  ['2001', 'V. HART'],
  ['2002', 'V. HART'],
  ['2003', 'V. HART'],
  ['2004', 'V. HART'],
  ['2005', 'V. HART'],
  ['2006', 'M. FROST'],
  ['2007', 'D. MOSS'],
  ['2008', 'M. FROST'],
]

function Board({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={i * 3.5} y={0} width="3.5" height="5" fill={i % 2 ? INK : BUFF} opacity="0.8" />
      ))}
    </g>
  )
}

function Sheet({ x, y, w, h, rotate }: { x: number; y: number; w: number; h: number; rotate: number }) {
  return (
    <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x} y={y} width={w} height={h} fill={BUFF} opacity="0.85" />
      {Array.from({ length: Math.floor((h - 14) / 8) }, (_, i) => (
        <line key={i} x1={x + 6} y1={y + 12 + i * 8} x2={x + w - 6} y2={y + 12 + i * 8} stroke={INK} strokeOpacity="0.25" />
      ))}
      <circle cx={x + w / 2} cy={y + 4} r="2.5" fill="#8a3f3a" />
    </g>
  )
}
