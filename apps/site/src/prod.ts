import { boot } from './shell'

boot(async (id) => {
  try {
    const res = await fetch(`/fragment/${id}`)
    if (!res.ok) return null

    const html = await res.text()
    const main = document.getElementById('main')
    if (!main) return null

    main.innerHTML = html

    const scriptTag = main.querySelector('script[type="module"]')
    if (!scriptTag) return null
    const src = scriptTag.getAttribute('src')
    if (!src) return null

    const mod = await import(src)
    return mod.work
  } catch (e) {
    console.error(`Failed to load work ${id}`, e)
    return null
  }
})
