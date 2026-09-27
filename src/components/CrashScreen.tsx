// If something in the app breaks, show this instead of a blank screen (Sep
// 2026, before friends and family started testing): a way back to Home, and
// a way to send the details through the phone's share sheet.
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { composeFeedback, describeDevice } from '../logic/feedback'
import { saveScreen } from '../storage/db'
import './CrashScreen.css'

type State = { error: Error | null; where: string }

export class CrashScreen extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, where: '' }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Club Night crashed', error, info.componentStack)
    // The first few components named in the stack say which screen it was.
    const where = (info.componentStack ?? '')
      .split('\n')
      .map((l) => l.trim().replace(/^at /, '').split(' ')[0])
      .filter(Boolean)
      .slice(0, 6)
      .join(' < ')
    this.setState({ where })
  }

  private async send() {
    const { error, where } = this.state
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
    const text = composeFeedback(`The app crashed.\n\nError: ${error?.message ?? 'unknown'}\nIn: ${where || 'unknown'}`, {
      version: BUILD_LABEL,
      whereTheyAre: 'crash screen',
      device: describeDevice(navigator.userAgent, standalone),
    })
    try {
      if (navigator.share) await navigator.share({ text })
      else await navigator.clipboard.writeText(text)
    } catch {
      // Closing the share sheet isn't worth a message here.
    }
  }

  private async goHome() {
    // Otherwise the app would reopen on the screen that broke.
    await saveScreen('home').catch(() => undefined)
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="crash-screen">
        <h1>Something went wrong</h1>
        <p>
          Sorry about that. Your progress is saved. Sending the details helps get it fixed; nothing is sent unless you
          choose to.
        </p>
        <button type="button" className="crash-primary" onClick={() => void this.send()}>
          Send the details
        </button>
        <button type="button" className="crash-secondary" onClick={() => void this.goHome()}>
          Back to Home
        </button>
        <p className="crash-detail">{this.state.error.message}</p>
      </main>
    )
  }
}
