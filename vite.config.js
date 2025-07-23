import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@/gsap': path.resolve(process.cwd(), 'src/js/gsap.ts'),
      '@/scroll': path.resolve(process.cwd(), 'src/js/scroll.ts'),
      '@/app': path.resolve(process.cwd(), 'src/js/app.js'),
      '@/gl/Gl': path.resolve(process.cwd(), 'src/js/gl/Gl.js'),
      '@/gl': path.resolve(process.cwd(), 'src/js/gl'),
      '@/modules': path.resolve(process.cwd(), 'src/js/modules'),
      '@/utils/subscribable': path.resolve(process.cwd(), 'src/js/utils/subscribable.ts'),
      '@/utils/environment': path.resolve(process.cwd(), 'src/js/utils/environment.ts'),
      '@/utils/client-rect': path.resolve(process.cwd(), 'src/js/utils/client-rect.ts'),
      '@/utils': path.resolve(process.cwd(), 'src/js/utils'),
      '@/transitions': path.resolve(process.cwd(), 'src/js/transitions'),
      '@': path.resolve(process.cwd(), 'src')
    }
  },
  assetsInclude: [
    '**/*.glb',
    '**/*.gltf',
    '**/*.hdr',
    '**/*.exr',
    '**/*.mp3',
    '**/*.wav',
    '**/*.ogg',
    '**/*.woff2',
    '**/*.woff'
  ],
  server: {
    host: true,
    port: 3000,
    open: true
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(process.cwd(), 'index.html')
      },
      output: {
        manualChunks: {
          'three': ['three'],
          'gsap': ['gsap'],
          'vendor': ['lenis', '@unseenco/taxi', 'TagCloud']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/loaders/GLTFLoader.js',
      'three/examples/jsm/loaders/DRACOLoader.js',
      'three/examples/jsm/loaders/RGBELoader.js',
      'three/examples/jsm/controls/OrbitControls.js',
      'gsap',
      'lenis',
      '@unseenco/taxi'
    ]
  }
})
