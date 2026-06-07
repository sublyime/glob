import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'three/webgpu': path.resolve(__dirname, 'src/shims/three-webgpu.js'),
      'three/tsl': path.resolve(__dirname, 'src/shims/three-tsl.js')
    }
  }
})
