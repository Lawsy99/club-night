// The player's name, as typed for Graham's membership list.

/** Longest name we'll take: it has to fit in the name bar under the board. */
export const MAX_NAME_LENGTH = 20

/** Tidies a typed name: trims spaces and collapses doubles. */
export function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH)
}
