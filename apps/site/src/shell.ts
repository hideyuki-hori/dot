import type { WorkLifecycle } from '@dot/schema'
import { createSurface } from './surface'
import { createLogger } from './logger'
import { createControls } from './controls'
import { resolve, onNavigate } from './router'
import type { Route } from './router'

export type WorkLoader = (id: string) => Promise<WorkLifecycle | null>

let device: GPUDevice | null = null
let current: WorkLifecycle | null = null
let rafId = 0
let prevTime = 0

const logger = createLogger()

async function initWebGPU(canvas: HTMLCanvasElement) {
  const adapter = await navigator.gpu?.requestAdapter()
  if (!adapter) {
    logger.error('WebGPU not supported')
    return null
  }
  if (!device) {
    device = await adapter.requestDevice()
  }

  const context = canvas.getContext('webgpu')
  if (!context) return null

  const format = navigator.gpu.getPreferredCanvasFormat()
  context.configure({ device, format })

  return { device, context, format }
}

function setupPointerControls(canvas: HTMLCanvasElement, bridge: ReturnType<typeof createControls>) {
  let dragging = false
  let lastX = 0
  let lastY = 0
  let camYaw = 0
  let camPitch = 0

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    canvas.setPointerCapture(e.pointerId)
  })

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return
    camYaw += (e.clientX - lastX) * 0.005
    camPitch += (e.clientY - lastY) * 0.005
    camPitch = Math.max(-Math.PI * 0.49, Math.min(Math.PI * 0.49, camPitch))
    lastX = e.clientX
    lastY = e.clientY
    bridge.setValue('cam-yaw', camYaw)
    bridge.setValue('cam-pitch', camPitch)
  })

  canvas.addEventListener('pointerup', () => {
    dragging = false
  })
}

function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  prevTime = 0
}

function startLoop(work: WorkLifecycle) {
  const loop = (time: number) => {
    const delta = prevTime ? time - prevTime : 0
    prevTime = time
    work.frame(time, delta)
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

async function mountWork(id: string, loadWork: WorkLoader) {
  const canvas = document.getElementById('canvas')
  if (!(canvas instanceof HTMLCanvasElement)) return

  const gpu = await initWebGPU(canvas)
  if (!gpu) return

  const work = await loadWork(id)
  if (!work) return

  const surface = createSurface(canvas, gpu.context)
  const bridge = createControls()

  const studyCanvases = document.querySelectorAll<HTMLCanvasElement>('canvas[data-study]')
  const studies: import('@dot/schema').Surface[] = []
  for (const sc of studyCanvases) {
    const studyContext = sc.getContext('webgpu')
    if (!studyContext) continue
    studyContext.configure({ device: gpu.device, format: gpu.format })
    studies.push(createSurface(sc, studyContext))
  }

  setupPointerControls(canvas, bridge)

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    work.resize(canvas.width, canvas.height)
  }
  window.addEventListener('resize', resize)
  resize()

  work.mount({
    main: surface,
    studies,
    device: gpu.device,
    logger,
    controls: bridge.controls,
  })

  current = work
  startLoop(work)
}

function unmountCurrent() {
  stopLoop()
  current?.unmount()
  current = null
}

async function handleRoute(route: Route | null, loadWork: WorkLoader) {
  unmountCurrent()

  if (!route) return

  if (route.type === 'work') {
    await mountWork(route.id, loadWork)
  }

  if (route.type === 'page') {
    try {
      const mod = await import(`./pages/${route.name}.ts`)
      mod.default?.()
    } catch (e) {
      logger.error(`Failed to load page ${route.name}`, e)
    }
  }
}

export function boot(loadWork: WorkLoader) {
  const route = resolve(location.pathname)
  handleRoute(route, loadWork)
  onNavigate((r) => handleRoute(r, loadWork))
}
