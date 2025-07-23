# 🚀 Performance Optimization Guide

## Overview
This guide covers performance optimization strategies, monitoring, and best practices for the TRANSLINK project.

---

## 📊 Performance Metrics

### Core Web Vitals
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Blocking Time (TBT)**: < 200ms
- **Speed Index**: < 2s

### Bundle Size Targets
- **Main Bundle**: < 500KB
- **Vendor Bundle**: < 800KB
- **Three.js Bundle**: < 600KB
- **GSAP Bundle**: < 200KB
- **Total Initial Load**: < 1MB

---

## 🎯 Optimization Strategies

### 1. Code Splitting

#### Route-Based Splitting
```javascript
// Dynamic imports for scenes
const sceneClasses = new Map();
sceneClasses.set('homepage', () => import('./MainScene.js'));
sceneClasses.set('specs', () => import('./SpecsScene.js'));
sceneClasses.set('settings', () => import('./SettingsScene.js'));
```

#### Component-Based Splitting
```javascript
// Lazy load heavy components
const MaterialSystem = await import('../materials/MaterialSystem.js');
const PostProcessing = await import('../effects/PostProcessing.js');
```

### 2. Tree Shaking

#### Three.js Optimization
```javascript
// Import only what you need
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three';
// Instead of: import * as THREE from 'three';
```

#### GSAP Optimization
```javascript
// Import specific plugins
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// Register only needed plugins
gsap.registerPlugin(ScrollTrigger);
```

### 3. Asset Optimization

#### 3D Models
- Use DRACO compression for GLTF models
- Optimize geometry (reduce vertices)
- Use texture atlases
- Implement LOD (Level of Detail)

#### Images
- Use WebP format with fallbacks
- Implement responsive images
- Use lazy loading for non-critical images
- Optimize texture sizes (power of 2)

#### Audio
- Use compressed formats (MP3, OGG)
- Implement audio streaming for large files
- Use Web Audio API for efficient playback

### 4. Rendering Optimization

#### WebGL Performance
```javascript
// Use object pooling
class ObjectPool {
    constructor(createFn, resetFn) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
    }
    
    get() {
        return this.pool.pop() || this.createFn();
    }
    
    release(obj) {
        this.resetFn(obj);
        this.pool.push(obj);
    }
}
```

#### Frustum Culling
```javascript
// Only render visible objects
scene.traverse((object) => {
    if (object.isMesh) {
        object.frustumCulled = true;
    }
});
```

#### Instancing for Repeated Objects
```javascript
// Use InstancedMesh for particles
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
```

---

## 📈 Performance Monitoring

### 1. Build-Time Analysis

#### Bundle Analyzer
```bash
npm run analyze
```

#### Performance Budget
```bash
npm run test:performance
```

### 2. Runtime Monitoring

#### WebGL Performance
```javascript
// Monitor render calls
const info = renderer.info;
console.log('Render calls:', info.render.calls);
console.log('Triangles:', info.render.triangles);
```

#### Memory Usage
```javascript
// Monitor memory usage
if (performance.memory) {
    console.log('Used:', performance.memory.usedJSHeapSize);
    console.log('Total:', performance.memory.totalJSHeapSize);
}
```

### 3. User Experience Metrics

#### Core Web Vitals
```javascript
// Measure LCP
new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
}).observe({ entryTypes: ['largest-contentful-paint'] });
```

---

## 🛠️ Development Tools

### 1. Performance Profiling

#### Chrome DevTools
- Use Performance tab for profiling
- Analyze main thread blocking
- Check for memory leaks

#### WebGL Inspector
- Monitor WebGL state changes
- Analyze draw calls
- Check texture usage

### 2. Testing Tools

#### Lighthouse CI
```bash
npm install -g @lhci/cli
lhci autorun
```

#### Bundle Analysis
```bash
npm run build
npx vite-bundle-analyzer dist
```

---

## 🎮 WebGL-Specific Optimizations

### 1. Geometry Optimization

#### Reduce Vertices
```javascript
// Use geometry simplification
const simplifiedGeometry = geometry.clone();
simplifiedGeometry.attributes.position.array = 
    simplifyVertices(geometry.attributes.position.array);
```

#### Use Buffer Geometry
```javascript
// Always use BufferGeometry
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
```

### 2. Material Optimization

#### Shader Caching
```javascript
// Cache compiled shaders
const shaderCache = new Map();

function getShader(vertexShader, fragmentShader) {
    const key = vertexShader + fragmentShader;
    if (!shaderCache.has(key)) {
        shaderCache.set(key, new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader
        }));
    }
    return shaderCache.get(key);
}
```

#### Texture Optimization
```javascript
// Optimize texture settings
texture.generateMipmaps = false;
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
```

### 3. Rendering Optimization

#### Render Targets
```javascript
// Use appropriate render target sizes
const pixelRatio = Math.min(window.devicePixelRatio, 2);
const renderTarget = new THREE.WebGLRenderTarget(
    width * pixelRatio,
    height * pixelRatio
);
```

#### Post-Processing
```javascript
// Optimize post-processing pipeline
const composer = new EffectComposer(renderer);
composer.setSize(width, height);
composer.setPixelRatio(pixelRatio);
```

---

## 📱 Mobile Optimization

### 1. Device-Specific Adjustments

#### Reduce Quality on Mobile
```javascript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
    // Reduce particle count
    particleCount = Math.floor(particleCount * 0.5);
    
    // Lower texture resolution
    textureSize = Math.floor(textureSize * 0.5);
    
    // Disable expensive effects
    bloomPass.enabled = false;
}
```

#### Touch Optimization
```javascript
// Optimize touch interactions
const touchHandler = {
    passive: true,
    capture: false
};

element.addEventListener('touchstart', handler, touchHandler);
```

### 2. Battery Optimization

#### Reduce Frame Rate
```javascript
// Adaptive frame rate
let targetFPS = 60;

function adaptiveRender() {
    if (battery && battery.level < 0.2) {
        targetFPS = 30;
    }
    
    setTimeout(() => {
        requestAnimationFrame(adaptiveRender);
    }, 1000 / targetFPS);
}
```

---

## 🔧 Build Optimization

### 1. Vite Configuration

#### Optimized Build
```javascript
export default defineConfig({
    build: {
        target: 'es2022',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    'three': ['three'],
                    'gsap': ['gsap'],
                    'vendor': ['lenis', '@unseenco/taxi']
                }
            }
        }
    }
});
```

### 2. Asset Pipeline

#### Image Optimization
```javascript
// Use imagetools for optimization
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
    plugins: [
        imagetools({
            defaultDirectives: new URLSearchParams({
                format: 'webp',
                quality: '80'
            })
        })
    ]
});
```

---

## 📊 Performance Testing

### 1. Automated Testing

#### Performance Tests
```javascript
describe('Performance', () => {
    test('should load within budget', async () => {
        const startTime = performance.now();
        await loadApplication();
        const loadTime = performance.now() - startTime;
        
        expect(loadTime).toBeLessThan(3000); // 3 seconds
    });
});
```

### 2. Continuous Monitoring

#### CI/CD Integration
```yaml
- name: Performance Test
  run: |
    npm run build
    npm run test:performance
    npm run lighthouse:ci
```

---

## 🎯 Performance Checklist

### Pre-Launch
- [ ] Bundle size under limits
- [ ] Core Web Vitals passing
- [ ] Mobile performance tested
- [ ] Accessibility score > 90
- [ ] SEO optimizations applied

### Post-Launch
- [ ] Real User Monitoring (RUM) setup
- [ ] Performance alerts configured
- [ ] Regular performance audits scheduled
- [ ] User feedback collection active

---

## 📚 Resources

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [Three.js Performance Tips](https://threejs.org/docs/#manual/en/introduction/Performance-tips)

### Monitoring
- [Web Vitals](https://web.dev/vitals/)
- [Performance Observer API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [Resource Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API)

---

*Keep performance at the forefront of development decisions for the best user experience.*