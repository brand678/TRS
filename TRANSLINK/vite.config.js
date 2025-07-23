import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      '@/core': path.resolve(process.cwd(), 'src/core'),
      '@/modules': path.resolve(process.cwd(), 'src/modules'),
      '@/components': path.resolve(process.cwd(), 'src/components'),
      '@/utils': path.resolve(process.cwd(), 'src/utils'),
      '@/assets': path.resolve(process.cwd(), 'src/assets'),
      '@/styles': path.resolve(process.cwd(), 'src/styles'),
      '@/webgl': path.resolve(process.cwd(), 'src/webgl'),
      '@/audio': path.resolve(process.cwd(), 'src/audio'),
      '@/theme': path.resolve(process.cwd(), 'src/theme')
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
    port: 3001,
    open: true
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: path.resolve(process.cwd(), 'index.html')
      },
      output: {
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.js', '') : 'chunk';
          return `assets/js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        manualChunks: {
          'three': ['three'],
          'gsap': ['gsap'],
          'vendor': ['lenis', '@unseenco/taxi', 'TagCloud'],
          'webgl-core': [
            'three/examples/jsm/loaders/GLTFLoader.js',
            'three/examples/jsm/loaders/DRACOLoader.js',
            'three/examples/jsm/loaders/RGBELoader.js'
          ],
          'webgl-controls': [
            'three/examples/jsm/controls/OrbitControls.js'
          ]
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