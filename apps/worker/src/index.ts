interface Env {
  PAGES: KVNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

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
