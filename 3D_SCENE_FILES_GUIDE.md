# 🎮 3D Scene Files - Editing Guide

## Overview
This document provides a comprehensive guide to all 3D scene files in the Aether project that can be edited to customize the WebGL experience.

---

## 🏗️ Core 3D Scene Files

### 1. Main Scene Controllers

#### `/src/js/gl/World/World.js`
**Purpose**: Master scene manager and controller
- Controls scene transitions between different views
- Manages multiple scene instances (main, specs, easter egg)
- Handles scene switching logic and animations
- Coordinates fluid cursor effects

**Key Editable Properties**:
```javascript
// Scene instances
scenes: {
    mainA: new SceneMain({ id: 'main-a' }),
    mainB: new SceneMain({ id: 'main-b' }),
    easterEgg: new SceneMain({ 
        id: 'easter-egg',
        fixedProgress: 0.105,
        camera: 'easter-egg'
    }),
    specs: new SceneSpecs({ id: 'specs' }),
    fwa: new SceneFWA({ id: 'fwa' })
}

// Mouse interaction settings
mouse: {
    eased: {
        camera: this.gl.mouse.createEasedNormalized(0.01),
        fresnel: this.gl.mouse.createEasedNormalized(0.05)
    }
}
```

---

### 2. Individual Scene Files

#### `/src/js/gl/World/Scenes/SceneMain.js`
**Purpose**: Primary 3D earbuds showcase scene
- Main product display and interactions
- Camera animations and controls
- 3D model positioning and materials
- Lighting setup and environment

**Key Editable Properties**:
```javascript
// Scene background color
this.scene.background = new THREE.Color(0x133153)

// Camera settings
this.settings = {
    camera: {
        cursorIntensity: {
            position: 1,
            rotation: 1
        }
    },
    idle: {
        cursorIntensity: { idle: 1 }
    }
}

// Model positioning
this.caseModel = this.gl.assets.models.scene.scene.getObjectByName('case').clone()
this.tube.rotation.x = Math.PI * (0.5 - 0.425)

// Camera positions
this.easterEggCameraPosition = new THREE.Vector3(0.5, 3, 10)
this.easterEggCameraTarget = new THREE.Vector3(1.5, 3, 0)
```

#### `/src/js/gl/World/Scenes/SceneSpecs.js`
**Purpose**: Product specifications display scene
- Single earphone focus view
- Rotation animations
- Material showcase

**Key Editable Properties**:
```javascript
// Camera setup
this.camera = new THREE.PerspectiveCamera(33, this.gl.sizes.width / this.gl.sizes.height, 0.1, 100)
this.camera.position.set(0, 0, 3.5)

// Model positioning
this.idle.position.set(-0.25, 0, 0)
this.idle.rotation.set(Math.PI / 2, 0, 0)
```

#### `/src/js/gl/World/Scenes/SceneFWA.js`
**Purpose**: FWA/Easter egg special scene
- Alternative showcase view
- Special camera angles and effects

---

## 🎨 Material & Shader Files

### 3. Materials System

#### `/src/js/gl/Utils/Materials.js`
**Purpose**: All 3D materials and visual properties
- Earphone materials (glass, base, silicone)
- Case materials (cover, tube)
- Shader uniforms and color mappings

**Key Editable Properties**:
```javascript
// Color definitions
COLOR_FRESNEL: new THREE.Uniform(new THREE.Color(0x60b2ff))
uEnvColor: new THREE.Uniform(new THREE.Color(0x182d3d))

// Material properties
uFresnelTransition: new THREE.Uniform(3)
uColorTransition: new THREE.Uniform(3)
uEnvIntensity: new THREE.Uniform(1.5)

// Texture mappings
tMatcap: new THREE.Uniform(gl.assets.textures.matcap.glass)
tMatcapMask: new THREE.Uniform(gl.assets.textures.case.matcapMask)
tEmissiveMask: new THREE.Uniform(gl.assets.textures.headphones.emissiveMask)
```

---

### 4. Shader Effects

#### `/src/js/gl/Shaders/FluidCursor/FluidCursor.js`
**Purpose**: Interactive cursor effects and fluid animations

#### `/src/js/gl/Utils/ShaderChunks.js`
**Purpose**: Reusable shader components and utilities

---

## 🌍 Geometry & Effects

### 5. Procedural Geometry

#### `/src/js/gl/World/Geometry/Circles.js`
**Purpose**: Circular geometry effects and animations

#### `/src/js/gl/World/Geometry/Particles.js`
**Purpose**: Particle systems and effects

#### `/src/js/gl/World/Geometry/Waves.js`
**Purpose**: Wave animations and fluid effects

---

## 🎯 Core System Files

### 6. Main GL System

#### `/src/js/gl/Gl.js`
**Purpose**: Main WebGL controller and initialization

#### `/src/js/gl/Renderer.js`
**Purpose**: Rendering pipeline and WebGL setup
```javascript
// Renderer configuration
this.instance = new THREE.WebGLRenderer({
    powerPreference: 'high-performance',
    precision: 'lowp'
})
this.instance.physicallyCorrectLights = true
```

#### `/src/js/gl/Assets/Assets.js`
**Purpose**: 3D asset loading and management
```javascript
// Asset paths
this.path = 'Project-Resources/aether1.itsoffbrand.io/assets'

// Model loading
this.customModelLoader(`${this.path}/models/scene-258.glb`, (_result) => {
    this.models.scene = _result
})
```

---

### 7. Utility Systems

#### `/src/js/gl/Utils/Debug.js`
**Purpose**: Debug controls and development tools

#### `/src/js/gl/Utils/Mouse.js`
**Purpose**: Mouse interactions and cursor tracking

#### `/src/js/gl/Utils/Sizes.js`
**Purpose**: Viewport management and responsive handling

#### `/src/js/gl/Utils/Time.js`
**Purpose**: Animation timing and frame management

---

## 📦 3D Model Files

### 8. 3D Assets (Binary Files)

#### `/public/assets/models/scene-258.glb`
**Purpose**: Main earbuds 3D model
- **Editing Tool Required**: Blender, Maya, 3ds Max, Cinema 4D
- Contains: Earphone geometry, case, tube, and interactive elements
- **Note**: This is the primary 3D asset for the entire application

#### **Adding New Models (Example: Vehicle)**
To add a new 3D model (e.g., vehicle.glb):

1. **Place model file**: `/public/assets/models/vehicle.glb`
2. **Update asset loading** in `/src/js/gl/Assets/Assets.js`:
```javascript
this.promises.push(
    this.customModelLoader(`${this.path}/models/vehicle.glb`, (_result) => {
        this.models.vehicle = _result
    })
)
```
3. **Create new scene** or **add to existing scene**
4. **Add to World.js** scene management

---

## 🛠️ Editing Capabilities

### ✅ Easily Editable (Code Files)

| File | Editable Properties |
|------|-------------------|
| **SceneMain.js** | Camera positions, lighting, model positioning, animations |
| **SceneSpecs.js** | Display angles, rotation speed, materials |
| **SceneFWA.js** | Easter egg scene setup, special effects |
| **Materials.js** | Colors, textures, material properties, uniforms |
| **Geometry/*.js** | Particle effects, wave animations, shapes |
| **World.js** | Scene transitions, scene management |

### 🎨 Visual Properties You Can Modify

- **Colors**: Material colors, background colors, lighting
- **Positions**: 3D model placement, camera positions
- **Animations**: Rotation speeds, transition timing, hover effects
- **Materials**: Transparency, roughness, metallic properties
- **Effects**: Particle systems, wave animations, cursor effects
- **Lighting**: Environment lighting, directional lights

---

## 🎯 Most Commonly Edited Files

For typical 3D scene modifications:

1. **`SceneMain.js`** - Main scene layout and interactions
2. **`Materials.js`** - Visual appearance and materials  
3. **`World.js`** - Scene management and transitions
4. **`SceneSpecs.js`** - Product showcase customization

---

## 📝 Quick Edit Examples

### Change Background Color
```javascript
// In SceneMain.js or SceneSpecs.js
this.scene.background = new THREE.Color(0x133153) // Dark blue
this.scene.background = new THREE.Color(0x000000) // Black
this.scene.background = new THREE.Color(0xffffff) // White
```

### Modify Camera Position
```javascript
// In SceneSpecs.js
this.camera.position.set(0, 0, 3.5) // Default
this.camera.position.set(2, 1, 4)   // Closer, angled view
```

### Change Material Colors
```javascript
// In Materials.js
COLOR_FRESNEL: new THREE.Uniform(new THREE.Color(0x60b2ff)) // Blue
COLOR_FRESNEL: new THREE.Uniform(new THREE.Color(0xff6060)) // Red
COLOR_FRESNEL: new THREE.Uniform(new THREE.Color(0x60ff60)) // Green
```

---

*Generated for Aether 3D WebGL Project*
