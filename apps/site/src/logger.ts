import type { Logger } from '@dot/schema'

export function createLogger(workId?: string): Logger {
  return {
    log: (...args: unknown[]) => console.log(...args),
    warn: (...args: unknown[]) => console.warn(...args),
    error: (...args: unknown[]) => {
      console.error(...args)
      const message = args.map(a => String(a)).join(' ')
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message,
          workId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {})
    },
  }
}
