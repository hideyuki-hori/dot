import { work } from './entry'

async function init() {
  const canvas = document.getElementById('canvas')
  if (!(canvas instanceof HTMLCanvasElement)) return

  const adapter = await navigator.gpu?.requestAdapter()
  if (!adapter) {
    console.error('WebGPU not supported')
    return
  }
  const device = await adapter.requestDevice()

  const context = canvas.getContext('webgpu')
  if (!context) return

  const format = navigator.gpu.getPreferredCanvasFormat()
  context.configure({ device, format })

  const surface = {
    get width() { return canvas.width },
    get height() { return canvas.height },
    getContext() { return context },
  }

  const logger = {
    log: (...args: unknown[]) => console.log(...args),
    warn: (...args: unknown[]) => console.warn(...args),
    error: (...args: unknown[]) => console.error(...args),
  }

  const valueHandlers = new Map<string, (value: string | number | boolean) => void>()
  const controls = {
    onAction: (_name: string, _handler: () => void) => {},
    getValue: (_name: string): string | number | boolean => false,
    onValue: (name: string, handler: (value: string | number | boolean) => void) => {
      valueHandlers.set(name, handler)
    },
  }

  let camYaw = 0
  let camPitch = 0
  let dragging = false
  let lastX = 0
  let lastY = 0

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
    valueHandlers.get('cam-yaw')?.(camYaw)
    valueHandlers.get('cam-pitch')?.(camPitch)
  })

  canvas.addEventListener('pointerup', () => {
    dragging = false
  })

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    work.resize(canvas.width, canvas.height)
  }
  window.addEventListener('resize', resize)
  resize()

  work.mount({
    main: surface,
    studies: [],
    device,
    logger,
    controls,
  })

  let prev = 0
  const loop = (time: number) => {
    const delta = prev ? time - prev : 0
    prev = time
    work.frame(time, delta)
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}

init()
