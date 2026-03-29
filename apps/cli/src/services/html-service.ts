import { Effect, Context, Layer } from 'effect'
import { renderPage, renderFragment } from '@dot/schema/html'
import type { WorkMeta } from '@dot/schema/html'

export class HtmlService extends Context.Tag('HtmlService')<HtmlService, {
  generatePage(meta: WorkMeta, entryScript: string, shellScript: string): Effect.Effect<string>
  generateFragment(meta: WorkMeta, entryScript: string): Effect.Effect<string>
}>() {}

export const HtmlServiceLive = Layer.succeed(HtmlService, {
  generatePage(meta: WorkMeta, entryScript: string, shellScript: string) {
    return Effect.succeed(renderPage(meta, entryScript, shellScript))
  },
  generateFragment(meta: WorkMeta, entryScript: string) {
    return Effect.succeed(renderFragment(meta, entryScript))
  },
})
