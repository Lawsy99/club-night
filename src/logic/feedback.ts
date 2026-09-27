// Feedback from testers (Sep 2026: friends and family trying the app). The
// message is written in the app and sent however the tester likes (Messages,
// WhatsApp, email) through the phone's share sheet, so no address is built in.
// A few details are added so a bug can be found: the version, where they
// are in the season, and the phone.

export type FeedbackContext = {
  version: string
  /** e.g. "Week 3, rating 1180" */
  whereTheyAre: string
  device: string
}

export function composeFeedback(message: string, ctx: FeedbackContext): string {
  return [
    'Club Night feedback',
    '',
    message.trim() || '(no message)',
    '',
    '---',
    `Version: ${ctx.version}`,
    `Where: ${ctx.whereTheyAre}`,
    `Phone: ${ctx.device}`,
  ].join('\n')
}

/** A short description of the phone and browser, from the user agent. */
export function describeDevice(userAgent: string, standalone: boolean): string {
  const os = /iPhone|iPad/.test(userAgent)
    ? `iOS ${/OS (\d+)_(\d+)/.exec(userAgent)?.slice(1, 3).join('.') ?? ''}`.trim()
    : /Android (\d+)/.test(userAgent)
      ? `Android ${/Android (\d+)/.exec(userAgent)![1]}`
      : /Mac OS X/.test(userAgent)
        ? 'Mac'
        : /Windows/.test(userAgent)
          ? 'Windows'
          : 'Other'
  const browser = /CriOS|Chrome/.test(userAgent) ? 'Chrome' : /Firefox|FxiOS/.test(userAgent) ? 'Firefox' : /Safari/.test(userAgent) ? 'Safari' : 'Browser'
  return `${os}, ${browser}${standalone ? ', home screen app' : ''}`
}
