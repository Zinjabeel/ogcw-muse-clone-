// @ts-nocheck -- WebGPU types aren't installed (no new packages), so this file talks to navigator.gpu untyped
//
// A small stand-in for the parts of the "vgpu" library that AeroShards
// (src/components/aero-shards.tsx, from React Bits) uses, written straight on
// WebGPU so the site needs no new package (owner, 21 Oct 2026). The same
// names and shapes: init, surface, target, sampler, uniforms, storage, draw,
// effect and frame. Shaders bind their resources by name (the names in their
// @group(0) @binding(n) lines); a resource that's resized gets a new bind
// group on the next draw.

const RENDER = 0x10; // GPUTextureUsage.RENDER_ATTACHMENT
const SAMPLED = 0x04; // GPUTextureUsage.TEXTURE_BINDING
const UNIFORM = 0x40; // GPUBufferUsage.UNIFORM
const STORAGE = 0x80; // GPUBufferUsage.STORAGE
const COPY_DST = 0x08; // GPUBufferUsage.COPY_DST

let nextId = 1;

export async function init(options = {}) {
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: options.powerPreference });
  if (!adapter) throw new Error("No WebGPU adapter");
  const device = await adapter.requestDevice();
  const listeners = new Set();
  const report = (error) => listeners.forEach((listener) => listener(error));
  device.addEventListener("uncapturederror", (event) => report(event.error instanceof Error ? event.error : new Error(event.error?.message ?? "WebGPU error")));
  device.lost.then((info) => { if (info.reason !== "destroyed") report(new Error(`WebGPU stopped: ${info.message}`)); });
  return {
    device,
    onError(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispose() { listeners.clear(); device.destroy(); },
  };
}

/** The canvas itself */
export function surface(instance, canvas, { size, format, alphaMode = "premultiplied" }) {
  const context = canvas.getContext("webgpu");
  if (!context) throw new Error("WebGPU canvas unavailable");
  canvas.width = size[0];
  canvas.height = size[1];
  context.configure({ device: instance.device, format, alphaMode });
  const out = {
    kind: "surface",
    format,
    size: [...size],
    resize(next) { out.size = [...next]; canvas.width = next[0]; canvas.height = next[1]; },
    colorView: () => context.getCurrentTexture().createView(),
  };
  return out;
}

export function sampler(instance, descriptor) {
  const made = instance.device.createSampler(descriptor);
  return { id: nextId++, version: 0, resource: () => made };
}

/** A texture to draw into and read from later (with an optional depth texture beside it) */
export function target(instance, { size, format, depth }) {
  const device = instance.device;
  const out = { kind: "target", id: nextId++, version: 0, format, depthFormat: depth || undefined, size: [...size], depth: null };
  const make = () => {
    out.texture?.destroy();
    out.texture = device.createTexture({ size: out.size, format, usage: RENDER | SAMPLED });
    out.view = out.texture.createView();
    if (depth) {
      out.depthTexture?.destroy();
      out.depthTexture = device.createTexture({ size: out.size, format: depth, usage: RENDER | SAMPLED });
      out.depthView = out.depthTexture.createView();
    }
    out.version += 1;
  };
  make();
  out.resource = () => out.view;
  out.colorView = () => out.view;
  if (depth) out.depth = { id: nextId++, get version() { return out.version; }, resource: () => out.depthView };
  out.resize = (next) => {
    if (next[0] === out.size[0] && next[1] === out.size[1]) return;
    out.size = [...next];
    make();
  };
  return out;
}

/** A uniform struct of vec4f fields, in the order given */
export function uniforms(instance, fields) {
  const device = instance.device;
  const names = Object.keys(fields);
  const data = new Float32Array(names.length * 4);
  names.forEach((name, index) => data.set(fields[name].slice(0, 4), index * 4));
  const buffer = device.createBuffer({ size: data.byteLength, usage: UNIFORM | COPY_DST });
  device.queue.writeBuffer(buffer, 0, data);
  return {
    id: nextId++,
    version: 0,
    resource: () => ({ buffer }),
    set(values) {
      for (const [name, value] of Object.entries(values)) {
        const index = names.indexOf(name);
        if (index >= 0) data.set(Array.from(value).slice(0, 4), index * 4);
      }
      device.queue.writeBuffer(buffer, 0, data);
    },
  };
}

export function storage(instance, byteLength) {
  const device = instance.device;
  const buffer = device.createBuffer({ size: Math.max(16, Math.ceil(byteLength / 16) * 16), usage: STORAGE | COPY_DST });
  return {
    id: nextId++,
    version: 0,
    resource: () => ({ buffer }),
    write(array) { device.queue.writeBuffer(buffer, 0, array.buffer, array.byteOffset, array.byteLength); },
  };
}

const bindingsOf = (code) => {
  const slots = {};
  const pattern = /@group\(0\)\s*@binding\((\d+)\)\s*var(?:<[^>]*>)?\s+(\w+)/g;
  let match;
  while ((match = pattern.exec(code))) slots[match[2]] = Number(match[1]);
  return slots;
};

const PREMULTIPLIED = { color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }, alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" } };

function program(instance, { code, vertexEntry, fragmentEntry, vertices, cull, depth, blend, label }) {
  const device = instance.device;
  const module = device.createShaderModule({ code, label });
  const slots = bindingsOf(code);
  const bound = {};
  let pipeline = null;
  let group = null;
  let groupKey = "";
  const out = {
    set(values) { Object.assign(bound, values); return out; },
    async compile(spec) {
      const colorFormat = spec.colors ? spec.colors[0] : spec.format;
      const depthFormat = spec.colors ? undefined : spec.depthFormat;
      const descriptor = {
        label,
        layout: "auto",
        vertex: { module, entryPoint: vertexEntry },
        fragment: { module, entryPoint: fragmentEntry, targets: [{ format: colorFormat, ...(blend === "premultiplied" ? { blend: PREMULTIPLIED } : {}) }] },
        primitive: { topology: "triangle-list", cullMode: !cull || cull === "none" ? "none" : cull },
      };
      if (depthFormat) {
        descriptor.depthStencil = depth
          ? { format: depthFormat, depthWriteEnabled: !!depth.write, depthCompare: depth.compare ?? "less" }
          : { format: depthFormat, depthWriteEnabled: false, depthCompare: "always" };
      }
      pipeline = await device.createRenderPipelineAsync(descriptor);
      group = null;
    },
    encode(pass, { instances = 1, firstInstance = 0 } = {}) {
      if (!pipeline) return;
      const names = Object.keys(slots).filter((name) => bound[name]);
      const key = names.map((name) => `${bound[name].id}.${bound[name].version}`).join("|");
      if (!group || key !== groupKey) {
        group = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: names.map((name) => ({ binding: slots[name], resource: bound[name].resource() })) });
        groupKey = key;
      }
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, group);
      pass.draw(vertices, instances, 0, firstInstance);
    },
  };
  return out;
}

export function draw(instance, { shader, entry = {}, vertices, cull, depth, blend, label }) {
  return program(instance, { code: shader, vertexEntry: entry.vertex ?? "vs_main", fragmentEntry: entry.fragment ?? "fs_main", vertices, cull, depth, blend, label });
}

// A full-screen pass: one triangle covering the target, with uv (0,0) at the top left
const FULLSCREEN = `
struct MiniGpuFullscreen { @builtin(position) position: vec4f, @location(0) uv: vec2f }
@vertex
fn mini_gpu_fullscreen(@builtin(vertex_index) index: u32) -> MiniGpuFullscreen {
  let p = vec2f(f32((index << 1u) & 2u), f32(index & 2u));
  var out: MiniGpuFullscreen;
  out.position = vec4f(p * 2.0 - 1.0, 0.0, 1.0);
  out.uv = vec2f(p.x, 1.0 - p.y);
  return out;
}
`;

export function effect(instance, shader, { label, blend, set } = {}) {
  const out = program(instance, { code: `${shader}\n${FULLSCREEN}`, vertexEntry: "mini_gpu_fullscreen", fragmentEntry: "fs_main", vertices: 3, blend, label });
  if (set) out.set(set);
  return out;
}

/** One frame: passes recorded in order, then sent to the GPU together */
export function frame(instance, record) {
  const device = instance.device;
  const encoder = device.createCommandEncoder();
  const current = {
    pass(options, fill) {
      const into = options.target;
      const clear = Array.isArray(options.clear) ? options.clear : null;
      const descriptor = {
        colorAttachments: [{
          view: into.colorView(),
          loadOp: clear ? "clear" : "load",
          storeOp: "store",
          clearValue: clear ? { r: clear[0], g: clear[1], b: clear[2], a: clear[3] } : { r: 0, g: 0, b: 0, a: 0 },
        }],
      };
      if (into.depthView) {
        descriptor.depthStencilAttachment = {
          view: into.depthView,
          depthLoadOp: options.clearDepth !== undefined ? "clear" : "load",
          depthClearValue: options.clearDepth ?? 1,
          depthStoreOp: "store",
        };
      }
      const pass = encoder.beginRenderPass(descriptor);
      fill({ draw: (item, drawOptions) => item.encode(pass, drawOptions) });
      pass.end();
    },
  };
  record(current);
  device.queue.submit([encoder.finish()]);
}
