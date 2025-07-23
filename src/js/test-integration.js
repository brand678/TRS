// Module Integration Testing Script
// This script tests module communication, WebGL integration, and event systems

export function testIntegration() {
    console.log("🔗 [Integration Test] Starting comprehensive integration testing...");
    
    // Test 1: Module Communication
    testModuleCommunication();
    
    // Test 2: WebGL-Module Integration
    testWebGLIntegration();
    
    // Test 3: Event System
    testEventSystem();
    
    // Test 4: Memory Management
    testMemoryManagement();
    
    // Test 5: Performance
    testPerformance();
    
    console.log("🔗 [Integration Test] All tests complete!");
}

function testModuleCommunication() {
    console.log("🔄 [Integration Test] Testing module communication...");
    
    // Test Cursor -> AudioToggler communication
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        console.log("🔄 [Integration Test] Cursor found, testing click interaction...");
        // Simulate click to test AudioToggler instantiation
        cursor.click();
    }
    
    // Test Menu -> WebGL communication
    const menu = document.querySelector('#main-nav');
    if (menu) {
        console.log("🔄 [Integration Test] Menu found, testing navigation...");
        console.log("🔄 [Integration Test] Menu aria-expanded:", menu.getAttribute('aria-expanded'));
    }
    
    // Test Loader -> Tags communication
    const loader = document.querySelector('.loader-w');
    const tags = document.querySelector('.tagcloud-w');
    if (loader && tags) {
        console.log("🔄 [Integration Test] Loader and Tags found, testing coordination...");
    }
}

function testWebGLIntegration() {
    console.log("🎮 [Integration Test] Testing WebGL-Module integration...");
    
    // Test WebGL context availability
    const canvas = document.querySelector('[data-gl-canvas]');
    if (canvas) {
        console.log("🎮 [Integration Test] WebGL canvas found:", canvas);
        
        // Test WebGL context
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
            console.log("🎮 [Integration Test] WebGL context available:", gl.getParameter(gl.VERSION));
        } else {
            console.warn("🎮 [Integration Test] WebGL context not available");
        }
    }
    
    // Test if GL instance is accessible globally
    if (window.Gl || window.gl) {
        console.log("🎮 [Integration Test] GL instance accessible globally");
    }
}

function testEventSystem() {
    console.log("📡 [Integration Test] Testing event system...");
    
    // Test global event listeners
    const eventTypes = ['resize', 'scroll', 'mousemove', 'click'];
    eventTypes.forEach(eventType => {
        const listeners = getEventListeners ? getEventListeners(window)[eventType] : null;
        if (listeners) {
            console.log(`📡 [Integration Test] ${eventType} listeners:`, listeners.length);
        }
    });
    
    // Test custom events
    try {
        const testEvent = new CustomEvent('test-integration', { detail: { test: true } });
        document.dispatchEvent(testEvent);
        console.log("📡 [Integration Test] Custom event dispatch working");
    } catch (error) {
        console.warn("📡 [Integration Test] Custom event error:", error);
    }
}

function testMemoryManagement() {
    console.log("🧠 [Integration Test] Testing memory management...");
    
    // Test module cleanup capabilities
    const moduleElements = document.querySelectorAll('[data-module]');
    moduleElements.forEach(element => {
        const moduleName = element.getAttribute('data-module');
        
        // Check if module has cleanup methods
        if (element._moduleInstance) {
            const instance = element._moduleInstance;
            const hasCleanup = typeof instance.destroy === 'function' || 
                             typeof instance.stop === 'function' ||
                             typeof instance.cleanup === 'function';
            console.log(`🧠 [Integration Test] ${moduleName} cleanup available:`, hasCleanup);
        }
    });
    
    // Test memory usage (basic)
    if (performance.memory) {
        console.log("🧠 [Integration Test] Memory usage:", {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
    }
}

function testPerformance() {
    console.log("⚡ [Integration Test] Testing performance...");
    
    // Test module loading time
    const startTime = performance.now();
    
    // Count active modules
    const moduleElements = document.querySelectorAll('[data-module]');
    const moduleCount = moduleElements.length;
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    console.log("⚡ [Integration Test] Performance metrics:", {
        moduleCount: moduleCount,
        loadTime: loadTime.toFixed(2) + 'ms',
        averagePerModule: (loadTime / moduleCount).toFixed(2) + 'ms'
    });
    
    // Test animation frame rate
    let frameCount = 0;
    const frameStart = performance.now();
    
    function countFrames() {
        frameCount++;
        if (frameCount < 60) {
            requestAnimationFrame(countFrames);
        } else {
            const frameEnd = performance.now();
            const fps = 1000 / ((frameEnd - frameStart) / 60);
            console.log("⚡ [Integration Test] Estimated FPS:", fps.toFixed(1));
        }
    }
    
    requestAnimationFrame(countFrames);
}

// Auto-run test after a delay to ensure modules are loaded
setTimeout(testIntegration, 2000);
