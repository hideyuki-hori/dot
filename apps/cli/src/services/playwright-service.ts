import { Effect, Context, Layer } from 'effect'

export class PlaywrightService extends Context.Tag('PlaywrightService')<PlaywrightService, {
  captureOgImage(workId: string): Effect.Effect<Buffer, Error>
}>() {}

export const PlaywrightServiceLive = Layer.succeed(PlaywrightService, {
  captureOgImage(workId: string) {
    return Effect.tryPromise({
      try: async () => {
        const { chromium } = await import('playwright')
        const browser = await chromium.launch({
          headless: false,
          args: [
            '--enable-unsafe-webgpu',
            '--enable-features=Vulkan',
          ],
        })
        try {
          const page = await browser.newPage({
            viewport: { width: 1200, height: 630 },
          })
          await page.goto(`file://${process.cwd()}/dist/works/${workId}/index.html`, {
            waitUntil: 'networkidle',
          })
          await page.waitForTimeout(2000)
          const buffer = await page.screenshot({ type: 'png' })
          return Buffer.from(buffer)
        } finally {
          await browser.close()
        }
      },
      catch: (e) => new Error(`OG image capture failed for ${workId}: ${e}`),
    })
  },
})
