import type { Surface } from '@dot/schema'

export function createSurface(canvas: HTMLCanvasElement, context: GPUCanvasContext): Surface {
  return {
    get width() { return canvas.width },
    get height() { return canvas.height },
    getContext() { return context },
  }
}
