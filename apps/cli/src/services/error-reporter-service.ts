import { Effect, Context, Layer } from 'effect'

export class ErrorReporterService extends Context.Tag('ErrorReporterService')<ErrorReporterService, {
  report(error: Error, context?: Record<string, string>): Effect.Effect<void, Error>
}>() {}

export const ErrorReporterServiceLive = Layer.succeed(
  ErrorReporterService,
  ErrorReporterService.of({
    report(error, context) {
      return Effect.tryPromise({
        try: () =>
          fetch(process.env.DISCORD_WEBHOOK_URL ?? '', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              content: `🚨 CLI Error: ${error.message}\nContext: ${JSON.stringify(context)}`,
            }),
          }).then(() => {}),
        catch: (e) => e instanceof Error ? e : new Error(String(e)),
      })
    },
  }),
)
