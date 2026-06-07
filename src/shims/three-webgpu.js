// Minimal shim for `three/webgpu` to satisfy imports when WebGPU is unavailable.
// Exports small placeholders; real WebGPU features are not supported by this shim.
export class WebGPURenderer {
  constructor() {
    throw new Error('WebGPURenderer is not available in this environment.')
  }
}

export class Attribute {}

export class StorageInstancedBufferAttribute {}

export default { WebGPURenderer, Attribute, StorageInstancedBufferAttribute }
