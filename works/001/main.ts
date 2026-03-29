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

  const controls = {
    onAction: (_name: string, _handler: () => void) => {},
    getValue: (_name: string): string | number | boolean => false,
    onValue: (_name: string, _handler: (value: string | number | boolean) => void) => {},
  }

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
