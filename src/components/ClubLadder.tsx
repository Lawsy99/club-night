// The club ladder, drawn as rungs rather than a table: faces, ratings, the
// player picked out in gold, and a bar showing how close the next rung is.
// A compact card for Home (you, and the people either side) and the full list.
import { nextRung, YOU, type LadderNews, type Rung } from '../logic/ladder'
import { Portrait } from './Portrait'
import './ClubLadder.css'

const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? 'th'}`

function Face({ rung, size }: { rung: Rung; size: number }) {
  if (rung.id === YOU) {
    return (
      <span className="ladder-you-face" style={{ width: size, height: size, flex: `0 0 ${size}px` }} aria-hidden="true">
        {rung.name[0]?.toUpperCase()}
      </span>
    )
  }
  return <Portrait who={rung.id} size={size} />
}

function Row({ rung, place, news }: { rung: Rung; place: number; news?: LadderNews }) {
  return (
    <li className={`ladder-row ${rung.id === YOU ? 'is-you' : ''} ${news ? `news-${news.kind}` : ''}`}>
      <span className="ladder-place">{place}</span>
      <Face rung={rung} size={36} />
      <span className="ladder-name">{rung.name}</span>
      <span className="ladder-rating">{rung.rating}</span>
    </li>
  )
}

/** "38 to pass Priya", with a bar filling from the person below to the person above. */
function Climb({ ladder }: { ladder: readonly Rung[] }) {
  const { above, gap, below } = nextRung(ladder)
  const you = ladder.find((r) => r.id === YOU)!
  if (!above) return <p className="ladder-climb top">Top of the club.</p>
  const floor = below ? below.rating : you.rating - 50
  const span = Math.max(1, above.rating + 1 - floor)
  const filled = Math.max(4, Math.min(100, ((you.rating - floor) / span) * 100))
  return (
    <div className="ladder-climb">
      <span className="ladder-bar" aria-hidden="true">
        <i style={{ width: `${filled}%` }} />
      </span>
      <span>
        <strong>{gap}</strong> to pass {above.name}
      </span>
    </div>
  )
}

/** Home: your place, the people either side, and the gap to the next rung. */
export function LadderCard({ ladder, news, onOpen }: { ladder: readonly Rung[]; news: LadderNews[]; onOpen: () => void }) {
  const i = ladder.findIndex((r) => r.id === YOU)
  const nearby = ladder.slice(Math.max(0, i - 1), i + 2)
  const first = Math.max(0, i - 1)
  return (
    <button type="button" className="ladder-card" onClick={onOpen}>
      <span className="ladder-card-head">
        <strong>Club ladder</strong>
        <span>
          {ordinal(i + 1)} of {ladder.length}
        </span>
      </span>
      <ol className="ladder-rows">
        {nearby.map((rung, k) => (
          <Row key={rung.id} rung={rung} place={first + k + 1} news={news.find((n) => n.id === rung.id)} />
        ))}
      </ol>
      <Climb ladder={ladder} />
    </button>
  )
}

/** The whole ladder. */
export function LadderList({ ladder, news }: { ladder: readonly Rung[]; news: LadderNews[] }) {
  return (
    <>
      <ol className="ladder-rows full">
        {ladder.map((rung, k) => (
          <Row key={rung.id} rung={rung} place={k + 1} news={news.find((n) => n.id === rung.id)} />
        ))}
      </ol>
      <Climb ladder={ladder} />
    </>
  )
}
