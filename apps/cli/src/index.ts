import { Args, Command } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Console, Effect, Layer } from 'effect'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  ViteService, ViteServiceLive,
  HtmlService, HtmlServiceLive,
  KvService, KvServiceLive,
  WorkerDeployService, WorkerDeployServiceLive,
  PlaywrightService, PlaywrightServiceLive,
} from './services/index.ts'

function padId(n: number): string {
  return String(n).padStart(3, '0')
}

const workNum = Args.integer({ name: 'n' }).pipe(Args.withDescription('Work number'))

const workNew = Command.make('new', {}, () =>
  Effect.gen(function* () {
    const entries = fs.readdirSync('works').filter(e => /^\d{3}$/.test(e)).sort()
    const next = entries.length > 0
      ? Number(entries[entries.length - 1]) + 1
      : 1
    const id = padId(next)
    const dir = path.join('works', id)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'entry.ts'), `const shader = /* wgsl */\`
struct Uniforms {
  time: f32,
  width: f32,
  height: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vs(@builtin(vertex_index) i: u32) -> VertexOutput {
  var pos = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0),
  );
  var out: VertexOutput;
  out.position = vec4f(pos[i], 0.0, 1.0);
  out.uv = pos[i] * 0.5 + 0.5;
  return out;
}

@fragment
fn fs(@location(0) uv: vec2f) -> @location(0) vec4f {
  let t = u.time * 0.001;
  return vec4f(uv, 0.5 + 0.5 * sin(t), 1.0);
}
\`

let pipeline: GPURenderPipeline | null = null
let uniformBuffer: GPUBuffer | null = null
let bindGroup: GPUBindGroup | null = null
let ctx: WorkContext | null = null
let currentWidth = 0
let currentHeight = 0

export const work: WorkLifecycle = {
  mount(context: WorkContext) {
    ctx = context
    const { device } = context

    const module = device.createShaderModule({ code: shader })

    uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    const bindGroupLayout = device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      }],
    })

    bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [{
        binding: 0,
        resource: { buffer: uniformBuffer },
      }],
    })

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    })

    pipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module,
        entryPoint: 'vs',
      },
      fragment: {
        module,
        entryPoint: 'fs',
        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
      },
    })
  },

  unmount() {
    uniformBuffer?.destroy()
    uniformBuffer = null
    pipeline = null
    bindGroup = null
    ctx = null
  },

  resize(width: number, height: number) {
    currentWidth = width
    currentHeight = height
  },

  frame(time: number, _delta: number) {
    if (!ctx || !pipeline || !uniformBuffer || !bindGroup) return

    const { device } = ctx
    const data = new Float32Array([time, currentWidth, currentHeight, 0])
    device.queue.writeBuffer(uniformBuffer, 0, data)

    const textureView = ctx.main.getContext().getCurrentTexture().createView()
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
      }],
    })

    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.draw(3)
    pass.end()

    device.queue.submit([encoder.finish()])
  },
}
`)
    fs.writeFileSync(path.join(dir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
    canvas { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="./main.ts"></script>
</body>
</html>
`)
    fs.writeFileSync(path.join(dir, 'main.ts'), `import { work } from './entry'

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
`)
    yield* Console.log(`Created works/${id}`)
  })
)

const workDev = Command.make('dev', { n: workNum }, ({ n }) =>
  Effect.gen(function* () {
    const id = padId(n)
    yield* Console.log(`Starting dev server for works/${id}...`)
    yield* Effect.tryPromise({
      try: async () => {
        const vite = await import('vite')
        const server = await vite.createServer({
          root: `works/${id}`,
          server: { open: true },
        })
        await server.listen()
        server.printUrls()
      },
      catch: (e) => new Error(`Dev server failed: ${e}`),
    })
    yield* Effect.never
  })
)

const workBuild = Command.make('build', { n: workNum }, ({ n }) =>
  Effect.gen(function* () {
    const id = padId(n)
    yield* Console.log(`Building works/${id}...`)
    const vite = yield* ViteService
    const entryScript = yield* vite.build(id)
    yield* Console.log(`Built: ${entryScript}`)
  })
)

const workMeta = Command.make('meta', { n: workNum }, ({ n }) =>
  Effect.gen(function* () {
    const id = padId(n)
    yield* Console.log(`TODO: meta editor for works/${id}`)
  })
)

const workDeploy = Command.make('deploy', { n: workNum }, ({ n }) =>
  Effect.gen(function* () {
    const id = padId(n)
    yield* Console.log(`Deploying works/${id}...`)

    const vite = yield* ViteService
    const html = yield* HtmlService
    const kv = yield* KvService

    const entryScript = yield* vite.build(id)

    const meta = {
      id,
      title: `Work ${id}`,
      description: `WebGPU art piece ${id}`,
      ogImage: `/og/${id}.png`,
    }

    const page = yield* html.generatePage(meta, entryScript)
    const fragment = yield* html.generateFragment(meta, entryScript)

    yield* kv.put(`page:/${id}`, page)
    yield* kv.put(`fragment:${id}`, fragment)

    yield* Console.log(`Deployed works/${id} to KV`)
  })
)

const workPublish = Command.make('publish', { n: workNum }, ({ n }) =>
  Effect.gen(function* () {
    const id = padId(n)
    yield* Console.log(`Publishing works/${id}...`)

    const vite = yield* ViteService
    const html = yield* HtmlService
    const kv = yield* KvService
    const pw = yield* PlaywrightService

    const entryScript = yield* vite.build(id)

    const ogBuffer = yield* pw.captureOgImage(id)
    yield* Console.log(`OG image captured (${ogBuffer.length} bytes)`)

    const meta = {
      id,
      title: `Work ${id}`,
      description: `WebGPU art piece ${id}`,
      ogImage: `/og/${id}.png`,
    }

    const page = yield* html.generatePage(meta, entryScript)
    const fragment = yield* html.generateFragment(meta, entryScript)

    yield* kv.put(`page:/${id}`, page)
    yield* kv.put(`fragment:${id}`, fragment)

    yield* Console.log(`Published works/${id}`)
  })
)

const workPublishAll = Command.make('publish-all', {}, () =>
  Effect.gen(function* () {
    yield* Console.log('Publishing all works...')

    const vite = yield* ViteService
    const html = yield* HtmlService
    const kv = yield* KvService
    const workerDeploy = yield* WorkerDeployService

    const entries = fs.readdirSync('works').filter(e => /^\d{3}$/.test(e)).sort()
    for (const id of entries) {
      yield* Console.log(`Building works/${id}...`)
      const entryScript = yield* vite.build(id)

      const meta = {
        id,
        title: `Work ${id}`,
        description: `WebGPU art piece ${id}`,
        ogImage: `/og/${id}.png`,
      }

      const page = yield* html.generatePage(meta, entryScript)
      const fragment = yield* html.generateFragment(meta, entryScript)

      yield* kv.put(`page:/${id}`, page)
      yield* kv.put(`fragment:${id}`, fragment)

      yield* Console.log(`Deployed works/${id}`)
    }

    yield* Console.log('Deploying worker...')
    yield* workerDeploy.deploy()
    yield* Console.log('All published')
  })
)

const work = Command.make('work').pipe(
  Command.withSubcommands([workNew, workDev, workBuild, workMeta, workDeploy, workPublish, workPublishAll])
)

const dot = Command.make('dot').pipe(
  Command.withSubcommands([work])
)

const MainLive = Layer.mergeAll(
  ViteServiceLive,
  HtmlServiceLive,
  KvServiceLive,
  WorkerDeployServiceLive,
  PlaywrightServiceLive,
)

const cli = Command.run(dot, { name: 'dot', version: '1.0.0' })

cli(process.argv).pipe(
  Effect.provide(MainLive),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain,
)
