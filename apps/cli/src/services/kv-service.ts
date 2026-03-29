import { Effect, Context, Layer } from 'effect'
import { loadConfig } from '../config.ts'

export class KvService extends Context.Tag('KvService')<KvService, {
  put(key: string, value: string): Effect.Effect<void, Error>
}>() {}

export const KvServiceLive = Layer.succeed(KvService, {
  put(key: string, value: string) {
    return Effect.tryPromise({
      try: async () => {
        const config = loadConfig()
        const { api_token, account_id, kv_namespace_id } = config.cloudflare

        if (!api_token || !account_id || !kv_namespace_id) {
          throw new Error('Missing Cloudflare config in ~/.config/dot/main.toml')
        }

        const url = `https://api.cloudflare.com/client/v4/accounts/${account_id}/storage/kv/namespaces/${kv_namespace_id}/values/${encodeURIComponent(key)}`

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${api_token}`,
            'Content-Type': 'text/plain',
          },
          body: value,
        })

        if (!response.ok) {
          const body = await response.text()
          throw new Error(`KV PUT failed (${response.status}): ${body}`)
        }
      },
      catch: (e) => e instanceof Error ? e : new Error(String(e)),
    })
  },
})
