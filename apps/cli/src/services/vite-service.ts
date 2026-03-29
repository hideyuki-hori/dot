import { Effect, Context, Layer } from 'effect'

export class ViteService extends Context.Tag('ViteService')<ViteService, {
  build(workId: string): Effect.Effect<string, Error>
}>() {}

export const ViteServiceLive = Layer.succeed(ViteService, {
  build(workId: string) {
    return Effect.tryPromise({
      try: async () => {
        const vite = await import('vite')
        await vite.build({
          root: `works/${workId}`,
          build: {
            outDir: `../../dist/works/${workId}`,
            rollupOptions: {
              input: `works/${workId}/entry.ts`,
            },
            lib: {
              entry: `works/${workId}/entry.ts`,
              formats: ['es'],
              fileName: 'entry',
            },
            emptyOutDir: true,
          },
        })
        return `dist/works/${workId}/entry.js`
      },
      catch: (e) => new Error(`Vite build failed for ${workId}: ${e}`),
    })
  },
})
