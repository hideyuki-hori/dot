import { boot } from './shell'

boot(async (id) => {
  try {
    const mod = await import(`/works/${id}/entry.ts`)
    return mod.work
  } catch (e) {
    console.error(`Failed to load work ${id}`, e)
    return null
  }
})
