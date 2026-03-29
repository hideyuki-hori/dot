import { Effect, Context, Layer } from 'effect'
import { exec } from 'node:child_process'

export class WorkerDeployService extends Context.Tag('WorkerDeployService')<WorkerDeployService, {
  deploy(): Effect.Effect<void, Error>
}>() {}

export const WorkerDeployServiceLive = Layer.succeed(WorkerDeployService, {
  deploy() {
    return Effect.tryPromise({
      try: () =>
        new Promise<void>((resolve, reject) => {
          exec('npx wrangler deploy', { cwd: 'apps/worker' }, (error, _stdout, stderr) => {
            if (error) {
              reject(new Error(`wrangler deploy failed: ${stderr}`))
              return
            }
            resolve()
          })
        }),
      catch: (e) => new Error(`Worker deploy failed: ${e}`),
    })
  },
})
