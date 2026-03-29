import { boot } from './shell'

declare global {
  var __DOT_WORK__: import('@dot/schema').WorkLifecycle | null
}

boot(async (id) => {
  if (globalThis.__DOT_WORK__) {
    const w = globalThis.__DOT_WORK__
    globalThis.__DOT_WORK__ = null
    return w
  }

  try {
    const res = await fetch(`/fragment/${id}`)
    if (!res.ok) return null

    const html = await res.text()
    const main = document.getElementById('main')
    if (!main) return null

    main.innerHTML = html

    const scriptTag = main.querySelector('script[type="module"]')
    if (!scriptTag?.textContent) return null

    const blob = new Blob([scriptTag.textContent], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const mod = await import(url)
    URL.revokeObjectURL(url)
    return mod.work
  } catch (e) {
    console.error(`Failed to load work ${id}`, e)
    return null
  }
})
