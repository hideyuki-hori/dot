const shader = /* wgsl */`
struct Uniforms {
  time: f32,
  width: f32,
  height: f32,
  cam_yaw: f32,
  cam_pitch: f32,
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

fn sdf_sphere(p: vec3f, r: f32) -> f32 {
  return length(p) - r;
}

fn scene(p: vec3f) -> f32 {
  return sdf_sphere(p, 1.0);
}

fn calc_normal(p: vec3f) -> vec3f {
  let e = vec2f(0.001, 0.0);
  return normalize(vec3f(
    scene(p + e.xyy) - scene(p - e.xyy),
    scene(p + e.yxy) - scene(p - e.yxy),
    scene(p + e.yyx) - scene(p - e.yyx),
  ));
}

fn rotate_y(a: f32) -> mat3x3f {
  let c = cos(a);
  let s = sin(a);
  return mat3x3f(
    vec3f(c, 0.0, s),
    vec3f(0.0, 1.0, 0.0),
    vec3f(-s, 0.0, c),
  );
}

fn rotate_x(a: f32) -> mat3x3f {
  let c = cos(a);
  let s = sin(a);
  return mat3x3f(
    vec3f(1.0, 0.0, 0.0),
    vec3f(0.0, c, -s),
    vec3f(0.0, s, c),
  );
}

@fragment
fn fs(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = u.width / u.height;
  var ndc = (uv - 0.5) * 2.0;
  ndc.x *= aspect;

  let rot = rotate_y(u.cam_yaw) * rotate_x(u.cam_pitch);
  let ro = rot * vec3f(0.0, 0.0, 3.0);
  let rd = normalize(rot * vec3f(ndc, -1.5));

  var t = 0.0;
  var hit = false;
  for (var i = 0; i < 128; i++) {
    let p = ro + rd * t;
    let d = scene(p);
    if (d < 0.001) {
      hit = true;
      break;
    }
    if (t > 100.0) {
      break;
    }
    t += d;
  }

  if (!hit) {
    return vec4f(0.02, 0.02, 0.03, 1.0);
  }

  let p = ro + rd * t;
  let n = calc_normal(p);
  let light_dir = normalize(vec3f(1.0, 1.0, 1.0));
  let diff = max(dot(n, light_dir), 0.0);
  let ambient = 0.08;
  let col = vec3f(0.9, 0.3, 0.2) * (diff + ambient);

  return vec4f(col, 1.0);
}
`

let pipeline: GPURenderPipeline | null = null
let uniformBuffer: GPUBuffer | null = null
let bindGroup: GPUBindGroup | null = null
let ctx: WorkContext | null = null
let currentWidth = 0
let currentHeight = 0
let camYaw = 0
let camPitch = 0

export const work: WorkLifecycle = {
  mount(context: WorkContext) {
    ctx = context
    const { device, controls } = context

    const module = device.createShaderModule({ code: shader })

    uniformBuffer = device.createBuffer({
      size: 32,
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

    controls.onValue('cam-yaw', (v) => { camYaw = Number(v) })
    controls.onValue('cam-pitch', (v) => { camPitch = Number(v) })
  },

  unmount() {
    uniformBuffer?.destroy()
    uniformBuffer = null
    pipeline = null
    bindGroup = null
    ctx = null
    camYaw = 0
    camPitch = 0
  },

  resize(width: number, height: number) {
    currentWidth = width
    currentHeight = height
  },

  frame(time: number, _delta: number) {
    if (!ctx || !pipeline || !uniformBuffer || !bindGroup) return

    const { device } = ctx
    const data = new Float32Array([time, currentWidth, currentHeight, 0, camYaw, camPitch, 0, 0])
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
