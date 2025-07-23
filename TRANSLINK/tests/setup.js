/**
 * TRANSLINK - Test Setup
 * Global test configuration and mocks
 */

// Mock WebGL context
const mockWebGLContext = {
    canvas: {},
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    getParameter: jest.fn(),
    getExtension: jest.fn(),
    createShader: jest.fn(),
    createProgram: jest.fn(),
    createBuffer: jest.fn(),
    createTexture: jest.fn(),
    createFramebuffer: jest.fn(),
    createRenderbuffer: jest.fn(),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    useProgram: jest.fn(),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    uniform1f: jest.fn(),
    uniform2f: jest.fn(),
    uniform3f: jest.fn(),
    uniform4f: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    clear: jest.fn(),
    clearColor: jest.fn(),
    clearDepth: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    depthFunc: jest.fn(),
    blendFunc: jest.fn(),
    viewport: jest.fn(),
    drawArrays: jest.fn(),
    drawElements: jest.fn(),
    bindTexture: jest.fn(),
    texImage2D: jest.fn(),
    texParameteri: jest.fn(),
    generateMipmap: jest.fn(),
    bindFramebuffer: jest.fn(),
    framebufferTexture2D: jest.fn(),
    checkFramebufferStatus: jest.fn(() => 36053), // FRAMEBUFFER_COMPLETE
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    ARRAY_BUFFER: 34962,
    ELEMENT_ARRAY_BUFFER: 34963,
    STATIC_DRAW: 35044,
    DYNAMIC_DRAW: 35048,
    FLOAT: 5126,
    UNSIGNED_SHORT: 5123,
    TEXTURE_2D: 3553,
    RGBA: 6408,
    UNSIGNED_BYTE: 5121,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240,
    LINEAR: 9729,
    CLAMP_TO_EDGE: 33071,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    COLOR_BUFFER_BIT: 16384,
    DEPTH_BUFFER_BIT: 256,
    DEPTH_TEST: 2929,
    BLEND: 3042,
    SRC_ALPHA: 770,
    ONE_MINUS_SRC_ALPHA: 771,
    FRAMEBUFFER: 36160,
    COLOR_ATTACHMENT0: 36064,
    FRAMEBUFFER_COMPLETE: 36053
};

// Mock HTMLCanvasElement
const mockCanvas = {
    width: 800,
    height: 600,
    getContext: jest.fn((type) => {
        if (type === 'webgl2' || type === 'webgl') {
            return mockWebGLContext;
        }
        return null;
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600
    })),
    style: {}
};

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
    value: jest.fn((tagName) => {
        if (tagName === 'canvas') {
            return mockCanvas;
        }
        return {
            tagName: tagName.toUpperCase(),
            style: {},
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn(),
                toggle: jest.fn()
            },
            setAttribute: jest.fn(),
            getAttribute: jest.fn(),
            removeAttribute: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => []),
            innerHTML: '',
            textContent: '',
            id: '',
            dataset: {},
            parentNode: null,
            children: []
        };
    }),
    writable: true
});

Object.defineProperty(document, 'querySelector', {
    value: jest.fn(() => mockCanvas),
    writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
    value: jest.fn(() => []),
    writable: true
});

Object.defineProperty(document, 'getElementById', {
    value: jest.fn(() => null),
    writable: true
});

Object.defineProperty(document, 'body', {
    value: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(),
            toggle: jest.fn()
        },
        style: {}
    },
    writable: true
});

Object.defineProperty(document, 'head', {
    value: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    },
    writable: true
});

Object.defineProperty(document, 'documentElement', {
    value: {
        style: {
            setProperty: jest.fn(),
            removeProperty: jest.fn(),
            getPropertyValue: jest.fn()
        },
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(),
            toggle: jest.fn()
        },
        setAttribute: jest.fn(),
        getAttribute: jest.fn()
    },
    writable: true
});

// Mock window properties
Object.defineProperty(window, 'innerWidth', {
    value: 800,
    writable: true
});

Object.defineProperty(window, 'innerHeight', {
    value: 600,
    writable: true
});

Object.defineProperty(window, 'devicePixelRatio', {
    value: 1,
    writable: true
});

Object.defineProperty(window, 'location', {
    value: {
        pathname: '/',
        search: '',
        href: 'http://localhost:3000/'
    },
    writable: true
});

Object.defineProperty(window, 'history', {
    value: {
        pushState: jest.fn(),
        replaceState: jest.fn(),
        scrollRestoration: 'auto'
    },
    writable: true
});

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
    writable: true
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
    value: jest.fn((callback) => {
        return setTimeout(callback, 16);
    }),
    writable: true
});

Object.defineProperty(window, 'cancelAnimationFrame', {
    value: jest.fn((id) => {
        clearTimeout(id);
    }),
    writable: true
});

// Mock performance
Object.defineProperty(window, 'performance', {
    value: {
        now: jest.fn(() => Date.now()),
        memory: {
            usedJSHeapSize: 1000000,
            totalJSHeapSize: 2000000,
            jsHeapSizeLimit: 4000000
        }
    },
    writable: true
});

// Mock URL
Object.defineProperty(window, 'URL', {
    value: {
        createObjectURL: jest.fn(() => 'blob:mock-url'),
        revokeObjectURL: jest.fn()
    },
    writable: true
});

// Mock Blob
Object.defineProperty(window, 'Blob', {
    value: jest.fn(() => ({})),
    writable: true
});

// Mock File
Object.defineProperty(window, 'File', {
    value: jest.fn(() => ({})),
    writable: true
});

// Mock FileReader
Object.defineProperty(window, 'FileReader', {
    value: jest.fn(() => ({
        readAsText: jest.fn(),
        onload: null,
        onerror: null,
        result: null
    })),
    writable: true
});

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
    value: jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
    })),
    writable: true
});

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
    value: jest.fn(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
    })),
    writable: true
});

// Mock MutationObserver
Object.defineProperty(window, 'MutationObserver', {
    value: jest.fn(() => ({
        observe: jest.fn(),
        disconnect: jest.fn()
    })),
    writable: true
});

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
};

// Mock Three.js modules that might not be available in test environment
jest.mock('three', () => ({
    Scene: jest.fn(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        traverse: jest.fn(),
        clear: jest.fn(),
        background: null
    })),
    PerspectiveCamera: jest.fn(() => ({
        position: { set: jest.fn(), copy: jest.fn(), x: 0, y: 0, z: 0 },
        rotation: { set: jest.fn(), x: 0, y: 0, z: 0 },
        lookAt: jest.fn(),
        updateProjectionMatrix: jest.fn(),
        aspect: 1
    })),
    WebGLRenderer: jest.fn(() => ({
        setSize: jest.fn(),
        setPixelRatio: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
        domElement: mockCanvas,
        info: {
            memory: { geometries: 0, textures: 0 },
            render: { calls: 0, triangles: 0 },
            programs: []
        }
    })),
    Color: jest.fn(() => ({
        set: jest.fn(),
        setHex: jest.fn(),
        r: 1, g: 1, b: 1
    })),
    Vector2: jest.fn(() => ({ x: 0, y: 0, set: jest.fn() })),
    Vector3: jest.fn(() => ({ x: 0, y: 0, z: 0, set: jest.fn(), copy: jest.fn() })),
    Group: jest.fn(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        position: { set: jest.fn(), x: 0, y: 0, z: 0 },
        rotation: { set: jest.fn(), x: 0, y: 0, z: 0 },
        scale: { set: jest.fn(), setScalar: jest.fn(), x: 1, y: 1, z: 1 }
    })),
    Clock: jest.fn(() => ({
        getDelta: jest.fn(() => 0.016),
        getElapsedTime: jest.fn(() => 1.0)
    })),
    WebGLRenderTarget: jest.fn(() => ({
        setSize: jest.fn(),
        dispose: jest.fn(),
        texture: {}
    })),
    SRGBColorSpace: 'srgb',
    LinearSRGBColorSpace: 'srgb-linear'
}));

// Global test utilities
global.testUtils = {
    mockCanvas,
    mockWebGLContext,
    localStorageMock,
    
    // Helper to wait for async operations
    waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Helper to trigger resize event
    triggerResize: (width = 800, height = 600) => {
        window.innerWidth = width;
        window.innerHeight = height;
        window.dispatchEvent(new Event('resize'));
    },
    
    // Helper to create mock theme
    createMockTheme: (name = 'Test') => ({
        name,
        version: '2.0',
        ui: {
            background: '#000000',
            text: '#ffffff',
            accent: '#ff0000'
        },
        '3d': {
            sceneBackground: '#111111',
            fresnelColor: '#0000ff'
        }
    })
};

// Suppress specific warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string') {
        // Suppress known warnings that are expected in test environment
        if (message.includes('WebGL') || 
            message.includes('Three.js') ||
            message.includes('GPU computation')) {
            return;
        }
    }
    originalWarn.apply(console, args);
};

// Set up global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    
    // Reset DOM state
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Reset localStorage
    localStorageMock.clear();
    
    // Reset window properties
    window.innerWidth = 800;
    window.innerHeight = 600;
    window.location.pathname = '/';
    window.location.search = '';
});