import { Effect, Context, Layer } from 'effect'

export class KvService extends Context.Tag('KvService')<KvService, {
  put(key: string, value: string): Effect.Effect<void, Error>
}>() {}

export const KvServiceLive = Layer.succeed(KvService, {
  put(key: string, value: string) {
    return Effect.tryPromise({
      try: async () => {
        const apiToken = process.env.CF_API_TOKEN
        const accountId = process.env.CF_ACCOUNT_ID
        const namespaceId = process.env.CF_KV_NAMESPACE_ID

        if (!apiToken || !accountId || !namespaceId) {
          throw new Error('Missing Cloudflare environment variables: CF_API_TOKEN, CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID')
        }

        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'text/plain',
          },
          body: value,
        })

        if (!response.ok) {
          const body = await response.text()
          throw new Error(`KV PUT failed (${response.status}): ${body}`)
        }
      },
      catch: (e) => new Error(`KV put failed for key "${key}": ${e}`),
    })
  },
})
