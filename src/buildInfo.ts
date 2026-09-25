// When this version of the app was built (set by vite.config.ts).
declare const __BUILD_TIME__: string

/** e.g. "25 Sep, 20:39" in the viewer's local time. */
export const BUILD_LABEL = new Date(__BUILD_TIME__).toLocaleString('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
