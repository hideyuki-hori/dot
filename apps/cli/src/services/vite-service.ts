import { Effect, Context, Layer } from 'effect'
import * as fs from 'node:fs'

export class ViteService extends Context.Tag('ViteService')<ViteService, {
  build(workId: string): Effect.Effect<string, Error>
  buildShell(): Effect.Effect<string, Error>
}>() {}

export const ViteServiceLive = Layer.succeed(ViteService, {
  build(workId: string) {
    return Effect.tryPromise({
      try: async () => {
        const vite = await import('vite')
        const outDir = `dist/works/${workId}`
        await vite.build({
          root: `works/${workId}`,
          build: {
            outDir: `../../${outDir}`,
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
        return fs.readFileSync(`${outDir}/entry.mjs`, 'utf-8')
      },
      catch: (e) => new Error(`Vite build failed for ${workId}: ${e}`),
    })
  },
  buildShell() {
    return Effect.tryPromise({
      try: async () => {
        const vite = await import('vite')
        const outDir = 'dist/shell'
        await vite.build({
          root: 'apps/site',
          build: {
            outDir: `../../${outDir}`,
            rollupOptions: {
              input: 'apps/site/src/prod.ts',
            },
            lib: {
              entry: 'apps/site/src/prod.ts',
              formats: ['es'],
              fileName: 'shell',
            },
            emptyOutDir: true,
          },
        })
        return fs.readFileSync(`${outDir}/shell.mjs`, 'utf-8')
      },
      catch: (e) => new Error(`Shell build failed: ${e}`),
    })
  },
})
