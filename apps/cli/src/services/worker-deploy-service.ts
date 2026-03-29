import { Effect, Context, Layer } from 'effect'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { loadConfig } from '../config.ts'

export class WorkerDeployService extends Context.Tag('WorkerDeployService')<WorkerDeployService, {
  deploy(): Effect.Effect<void, Error>
}>() {}

export const WorkerDeployServiceLive = Layer.succeed(WorkerDeployService, {
  deploy() {
    return Effect.tryPromise({
      try: async () => {
        const config = loadConfig()
        const { api_token, account_id, kv_namespace_id } = config.cloudflare
        const workerName = config.cloudflare.worker.name

        const scriptPath = path.resolve('apps/worker/src/index.ts')
        const scriptContent = fs.readFileSync(scriptPath, 'utf-8')

        const metadata = {
          main_module: 'index.ts',
          bindings: [
            {
              type: 'kv_namespace',
              name: 'PAGES',
              namespace_id: kv_namespace_id,
            },
          ],
          compatibility_date: '2024-01-01',
        }

        const formData = new FormData()
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
        formData.append('index.ts', new Blob([scriptContent], { type: 'application/javascript+module' }), 'index.ts')

        const url = `https://api.cloudflare.com/client/v4/accounts/${account_id}/workers/scripts/${workerName}`

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${api_token}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const body = await response.text()
          throw new Error(`Worker deploy failed (${response.status}): ${body}`)
        }
      },
      catch: (e) => e instanceof Error ? e : new Error(String(e)),
    })
  },
})
