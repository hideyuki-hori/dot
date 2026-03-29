interface Env {
  PAGES: KVNamespace
  DISCORD_WEBHOOK_URL: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'POST' && path === '/api/errors') {
      const body: {
        message: string
        stack?: string
        workId?: string
        timestamp: string
        userAgent?: string
      } = await request.json()
      const hex = crypto.getRandomValues(new Uint8Array(8))
        .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')
      const key = `error:${body.timestamp}:${hex}`
      await env.PAGES.put(key, JSON.stringify(body))
      if (env.DISCORD_WEBHOOK_URL) {
        await fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            content: `🚨 Error in ${body.workId ?? 'unknown'}: ${body.message}`,
          }),
        }).catch(() => {})
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
      })
    }

    const fragmentPrefix = '/fragment/'
    if (path.startsWith(fragmentPrefix)) {
      const slug = path.slice(fragmentPrefix.length)
      const key = `fragment:${slug}`
      const stream = await env.PAGES.get(key, { type: 'stream' })
      if (!stream) {
        return new Response('Not Found', { status: 404 })
      }
      return new Response(stream, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }

    const key = `page:${path}`
    const stream = await env.PAGES.get(key, { type: 'stream' })
    if (!stream) {
      return new Response('Not Found', { status: 404 })
    }
    return new Response(stream, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  },
}
