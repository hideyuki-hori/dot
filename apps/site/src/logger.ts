import type { Logger } from '@dot/schema'

export function createLogger(): Logger {
  return {
    log: (...args: unknown[]) => console.log(...args),
    warn: (...args: unknown[]) => console.warn(...args),
    error: (...args: unknown[]) => console.error(...args),
  }
}
