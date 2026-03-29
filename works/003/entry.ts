const shader = /* wgsl */`
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
`

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
