// Small drawn icons for the move-stepping buttons. Text symbols like ▶ turn
// into emoji on iPhone, so these are plain SVG shapes in the text colour.

type IconProps = { flip?: boolean }

const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'currentColor',
  'aria-hidden': true,
} as const

/** One step: a single triangle, pointing right (or left when flipped). */
export function StepIcon({ flip = false }: IconProps) {
  return (
    <svg {...svgProps} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M6 4 L15 10 L6 16 Z" />
    </svg>
  )
}

/** To the end: triangle plus bar, pointing right (or to the start when flipped). */
export function SkipIcon({ flip = false }: IconProps) {
  return (
    <svg {...svgProps} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M4 4 L12 10 L4 16 Z" />
      <rect x="13" y="4" width="2.5" height="12" rx="1" />
    </svg>
  )
}
