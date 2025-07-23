// Module Testing Script
// This script tests if all modules are working correctly

export function testModules() {
    console.log("🧪 [Module Test] Starting comprehensive module testing...");
    
    // Test 1: Check if modules are created
    const moduleElements = document.querySelectorAll('[data-module]');
    console.log(`🧪 [Module Test] Found ${moduleElements.length} module elements:`, moduleElements);
    
    moduleElements.forEach(element => {
        const moduleName = element.getAttribute('data-module');
        console.log(`🧪 [Module Test] Testing ${moduleName}:`, element);
        
        // Check if element has any classes added by the module
        console.log(`🧪 [Module Test] ${moduleName} classes:`, element.className);
        
        // Check if element has any custom properties
        console.log(`🧪 [Module Test] ${moduleName} dataset:`, element.dataset);
    });
    
    // Test 2: Check WebGL Canvas
    const glCanvas = document.querySelector('[data-gl-canvas]');
    console.log("🧪 [Module Test] WebGL Canvas:", glCanvas);
    
    // Test 3: Check if cursor is working
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        console.log("🧪 [Module Test] Cursor element found:", cursor);
        console.log("🧪 [Module Test] Cursor styles:", getComputedStyle(cursor));
    }
    
    // Test 4: Check if menu is working
    const menu = document.querySelector('#main-nav');
    if (menu) {
        console.log("🧪 [Module Test] Menu element found:", menu);
        console.log("🧪 [Module Test] Menu aria-expanded:", menu.getAttribute('aria-expanded'));
    }
    
    // Test 5: Check if loader is working
    const loader = document.querySelector('.loader-w');
    if (loader) {
        console.log("🧪 [Module Test] Loader element found:", loader);
        console.log("🧪 [Module Test] Loader display:", getComputedStyle(loader).display);
    }
    
    console.log("🧪 [Module Test] Testing complete!");
}

// Auto-run test after DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testModules);
} else {
    testModules();
}
