interface Surface {
  width: number
  height: number
  getContext(): GPUCanvasContext
}

interface Logger {
  log(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}

interface WorkControls {
  onAction(name: string, handler: () => void): void
  getValue(name: string): string | number | boolean
  onValue(name: string, handler: (value: string | number | boolean) => void): void
}

interface WorkContext {
  main: Surface
  studies: Surface[]
  device: GPUDevice
  logger: Logger
  controls: WorkControls
}

interface WorkLifecycle {
  mount(ctx: WorkContext): void
  unmount(): void
  resize(width: number, height: number): void
  frame(time: number, delta: number): void
}
