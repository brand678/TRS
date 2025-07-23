/**
 * TRANSLINK - Three.js Mock
 * Mock implementation of Three.js for testing
 */

export const Scene = jest.fn(() => ({
  add: jest.fn(),
  remove: jest.fn(),
  traverse: jest.fn(),
  clear: jest.fn(),
  background: null,
  children: []
}));

export const PerspectiveCamera = jest.fn(() => ({
  position: { 
    set: jest.fn(), 
    copy: jest.fn(), 
    x: 0, y: 0, z: 0 
  },
  rotation: { 
    set: jest.fn(), 
    x: 0, y: 0, z: 0 
  },
  lookAt: jest.fn(),
  updateProjectionMatrix: jest.fn(),
  aspect: 1,
  fov: 50,
  near: 0.1,
  far: 1000
}));

export const WebGLRenderer = jest.fn(() => ({
  setSize: jest.fn(),
  setPixelRatio: jest.fn(),
  render: jest.fn(),
  dispose: jest.fn(),
  setClearColor: jest.fn(),
  clear: jest.fn(),
  setRenderTarget: jest.fn(),
  domElement: {
    style: {},
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  info: {
    memory: { geometries: 0, textures: 0 },
    render: { calls: 0, triangles: 0 },
    programs: []
  }
}));

export const Color = jest.fn((color) => ({
  set: jest.fn(),
  setHex: jest.fn(),
  copy: jest.fn(),
  r: 1, g: 1, b: 1,
  getHex: jest.fn(() => 0xffffff)
}));

export const Vector2 = jest.fn(() => ({ 
  x: 0, y: 0, 
  set: jest.fn(),
  copy: jest.fn(),
  normalize: jest.fn(),
  length: jest.fn(() => 0)
}));

export const Vector3 = jest.fn(() => ({ 
  x: 0, y: 0, z: 0, 
  set: jest.fn(),
  copy: jest.fn(),
  normalize: jest.fn(),
  length: jest.fn(() => 0),
  clone: jest.fn(() => new Vector3())
}));

export const Group = jest.fn(() => ({
  add: jest.fn(),
  remove: jest.fn(),
  position: { set: jest.fn(), x: 0, y: 0, z: 0 },
  rotation: { set: jest.fn(), x: 0, y: 0, z: 0 },
  scale: { set: jest.fn(), setScalar: jest.fn(), x: 1, y: 1, z: 1 },
  traverse: jest.fn(),
  clone: jest.fn()
}));

export const Mesh = jest.fn(() => ({
  position: { set: jest.fn(), x: 0, y: 0, z: 0 },
  rotation: { set: jest.fn(), x: 0, y: 0, z: 0 },
  scale: { set: jest.fn(), setScalar: jest.fn(), x: 1, y: 1, z: 1 },
  material: null,
  geometry: null,
  visible: true,
  renderOrder: 0
}));

export const BufferGeometry = jest.fn(() => ({
  setAttribute: jest.fn(),
  dispose: jest.fn(),
  computeBoundingBox: jest.fn(),
  computeBoundingSphere: jest.fn(),
  attributes: {}
}));

export const BufferAttribute = jest.fn(() => ({
  array: [],
  count: 0,
  needsUpdate: false
}));

export const Material = jest.fn(() => ({
  dispose: jest.fn(),
  clone: jest.fn(),
  transparent: false,
  opacity: 1
}));

export const MeshStandardMaterial = jest.fn(() => ({
  ...Material(),
  color: new Color(),
  metalness: 0,
  roughness: 1,
  emissive: new Color(),
  uniforms: {}
}));

export const ShaderMaterial = jest.fn(() => ({
  ...Material(),
  uniforms: {},
  vertexShader: '',
  fragmentShader: ''
}));

export const Texture = jest.fn(() => ({
  dispose: jest.fn(),
  clone: jest.fn(),
  wrapS: 1001,
  wrapT: 1001,
  flipY: true
}));

export const WebGLRenderTarget = jest.fn(() => ({
  setSize: jest.fn(),
  dispose: jest.fn(),
  texture: new Texture()
}));

export const Clock = jest.fn(() => ({
  getDelta: jest.fn(() => 0.016),
  getElapsedTime: jest.fn(() => 1.0),
  start: jest.fn(),
  stop: jest.fn()
}));

export const AudioListener = jest.fn(() => ({
  setMasterVolume: jest.fn(),
  context: {
    state: 'running',
    resume: jest.fn().mockResolvedValue()
  }
}));

export const Audio = jest.fn(() => ({
  setBuffer: jest.fn(),
  setLoop: jest.fn(),
  setVolume: jest.fn(),
  play: jest.fn(),
  stop: jest.fn(),
  isPlaying: false
}));

export const AudioLoader = jest.fn(() => ({
  load: jest.fn((url, onLoad, onProgress, onError) => {
    setTimeout(() => onLoad({}), 0);
  })
}));

// Constants
export const SRGBColorSpace = 'srgb';
export const LinearSRGBColorSpace = 'srgb-linear';
export const RepeatWrapping = 1000;
export const ClampToEdgeWrapping = 1001;
export const AdditiveBlending = 2;
export const MultiplyBlending = 4;
export const DoubleSide = 2;
export const FrontSide = 0;
export const BackSide = 1;

// Math utilities
export const MathUtils = {
  degToRad: jest.fn((degrees) => degrees * Math.PI / 180),
  radToDeg: jest.fn((radians) => radians * 180 / Math.PI),
  clamp: jest.fn((value, min, max) => Math.max(min, Math.min(max, value))),
  lerp: jest.fn((x, y, t) => x * (1 - t) + y * t),
  damp: jest.fn((x, y, lambda, dt) => x + (y - x) * (1 - Math.exp(-lambda * dt)))
};

// Default export
export default {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  Vector2,
  Vector3,
  Group,
  Mesh,
  BufferGeometry,
  BufferAttribute,
  Material,
  MeshStandardMaterial,
  ShaderMaterial,
  Texture,
  WebGLRenderTarget,
  Clock,
  AudioListener,
  Audio,
  AudioLoader,
  SRGBColorSpace,
  LinearSRGBColorSpace,
  RepeatWrapping,
  ClampToEdgeWrapping,
  AdditiveBlending,
  MultiplyBlending,
  DoubleSide,
  FrontSide,
  BackSide,
  MathUtils
};