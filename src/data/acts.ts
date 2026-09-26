// The acts in order. The player's progress says which one they're in; older
// saves (from before Act 2 existed) are in Act 1.
import { ACT_1, type ActPlan } from './act1'
import { ACT_2 } from './act2'

export const ACTS: ActPlan[] = [ACT_1, ACT_2]

/** The act a save is in (1 if not set). */
export function actNumber(p: { act?: number }): number {
  return p.act ?? 1
}

export function actPlan(p: { act?: number }): ActPlan {
  return ACTS[actNumber(p) - 1] ?? ACT_1
}

/** Is there another act after this one? */
export function hasNextAct(p: { act?: number }): boolean {
  return actNumber(p) < ACTS.length
}

/**
 * Weeks before this act started (so the calendar carries on: Week 17 is the
 * first of the second season). Each act is its weeks plus the final week.
 */
export function weeksBefore(p: { act?: number }): number {
  return ACTS.slice(0, actNumber(p) - 1).reduce((sum, a) => sum + a.chapters.length + 1, 0)
}

/** The act and week a week id belongs to ("a2-3" → Act 2, week index 2). */
export function findWeek(id: string): { act: ActPlan; index: number } | null {
  for (const act of ACTS) {
    const index = act.chapters.findIndex((c) => c.id === id)
    if (index >= 0) return { act, index }
  }
  return null
}
