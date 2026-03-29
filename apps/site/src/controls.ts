import type { WorkControls } from '@dot/schema'

export interface ControlsBridge {
  controls: WorkControls
  setValue(name: string, value: string | number | boolean): void
  triggerAction(name: string): void
}

export function createControls(): ControlsBridge {
  const actionHandlers = new Map<string, () => void>()
  const valueHandlers = new Map<string, (value: string | number | boolean) => void>()
  const values = new Map<string, string | number | boolean>()

  return {
    controls: {
      onAction(name: string, handler: () => void) {
        actionHandlers.set(name, handler)
      },
      getValue(name: string): string | number | boolean {
        return values.get(name) ?? false
      },
      onValue(name: string, handler: (value: string | number | boolean) => void) {
        valueHandlers.set(name, handler)
      },
    },
    setValue(name: string, value: string | number | boolean) {
      values.set(name, value)
      valueHandlers.get(name)?.(value)
    },
    triggerAction(name: string) {
      actionHandlers.get(name)?.()
    },
  }
}
