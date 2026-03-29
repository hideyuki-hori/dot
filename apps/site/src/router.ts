export type Route = {
  type: 'work'
  id: string
} | {
  type: 'page'
  name: string
}

const STATIC_PAGES = new Set(['about', 'design-token'])

export function resolve(pathname: string): Route | null {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  if (segments.length === 1) {
    const segment = segments[0]
    if (STATIC_PAGES.has(segment)) {
      return { type: 'page', name: segment }
    }
    if (/^\d{3}$/.test(segment)) {
      return { type: 'work', id: segment }
    }
  }

  return null
}

export function onNavigate(callback: (route: Route | null) => void): () => void {
  const handle = () => callback(resolve(location.pathname))

  window.addEventListener('popstate', handle)

  document.addEventListener('click', (e) => {
    const anchor = (e.target instanceof Element) ? e.target.closest('a') : null
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (!href || href.startsWith('http') || href.startsWith('//')) return

    e.preventDefault()
    history.pushState(null, '', href)
    handle()
  })

  return () => window.removeEventListener('popstate', handle)
}
