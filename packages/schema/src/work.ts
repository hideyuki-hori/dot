export interface Surface {
  width: number
  height: number
  getContext(): GPUCanvasContext
}

export interface Logger {
  log(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}

export interface WorkControls {
  onAction(name: string, handler: () => void): void
  getValue(name: string): string | number | boolean
  onValue(name: string, handler: (value: string | number | boolean) => void): void
}

export interface WorkContext {
  main: Surface
  studies: Surface[]
  device: GPUDevice
  logger: Logger
  controls: WorkControls
}

export interface WorkLifecycle {
  mount(ctx: WorkContext): void
  unmount(): void
  resize(width: number, height: number): void
  frame(time: number, delta: number): void
}
