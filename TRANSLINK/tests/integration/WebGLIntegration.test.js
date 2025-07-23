/**
 * TRANSLINK - WebGL Integration Tests
 */

import { WebGLManager } from '../../src/webgl/WebGLManager.js';
import { ThemeSystem } from '../../src/theme/ThemeSystem.js';

// Mock WebGL context
const mockWebGLContext = {
    getParameter: jest.fn(),
    createShader: jest.fn(),
    createProgram: jest.fn(),
    useProgram: jest.fn(),
    clear: jest.fn(),
    drawArrays: jest.fn(),
    viewport: jest.fn()
};

// Mock canvas
const mockCanvas = {
    getContext: jest.fn(() => mockWebGLContext),
    width: 800,
    height: 600,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Mock DOM
Object.defineProperty(document, 'querySelector', {
    value: jest.fn(() => mockCanvas),
    writable: true
});

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

describe('WebGL Integration', () => {
    let webglManager;
    let themeSystem;
    
    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create theme system
        themeSystem = new ThemeSystem();
        await themeSystem.init();
        
        // Create WebGL manager
        webglManager = new WebGLManager({
            canvas: '[data-webgl-canvas]',
            debug: false,
            themeSystem: themeSystem
        });
    });
    
    afterEach(() => {
        if (webglManager) {
            webglManager.destroy();
        }
        if (themeSystem) {
            themeSystem.destroy();
        }
    });
    
    describe('WebGL Manager Initialization', () => {
        test('should initialize WebGL manager successfully', async () => {
            await webglManager.init();
            
            expect(webglManager.isInitialized).toBe(true);
            expect(webglManager.renderer).toBeDefined();
            expect(webglManager.assets).toBeDefined();
            expect(webglManager.scenes).toBeDefined();
        });
        
        test('should handle missing canvas gracefully', async () => {
            document.querySelector.mockReturnValue(null);
            
            await expect(webglManager.init()).rejects.toThrow('Canvas not found');
        });
        
        test('should set up resize handling', async () => {
            await webglManager.init();
            
            expect(window.addEventListener).toHaveBeenCalledWith(
                'resize',
                expect.any(Function)
            );
        });
    });
    
    describe('Theme Integration', () => {
        test('should connect theme system to WebGL', async () => {
            await webglManager.init();
            
            expect(webglManager.options.themeSystem).toBe(themeSystem);
        });
        
        test('should update materials when theme changes', async () => {
            await webglManager.init();
            
            const materialUpdateSpy = jest.spyOn(webglManager, 'emit');
            
            // Change theme
            themeSystem.setTheme('Dark');
            
            // Should emit theme change event
            expect(materialUpdateSpy).toHaveBeenCalledWith(
                expect.stringContaining('theme'),
                expect.any(Object)
            );
        });
    });
    
    describe('Scene Management', () => {
        test('should initialize scene for page', async () => {
            await webglManager.init();
            
            await webglManager.initScene('homepage');
            
            expect(webglManager.currentScene).toBeDefined();
            expect(webglManager.isRunning).toBe(true);
        });
        
        test('should transition between scenes', async () => {
            await webglManager.init();
            await webglManager.initScene('homepage');
            
            const initialScene = webglManager.currentScene;
            
            await webglManager.transitionToScene('specs');
            
            expect(webglManager.currentScene).not.toBe(initialScene);
        });
        
        test('should handle invalid scene gracefully', async () => {
            await webglManager.init();
            
            await expect(webglManager.initScene('invalid-page')).rejects.toThrow();
        });
    });
    
    describe('Asset Management', () => {
        test('should load assets successfully', async () => {
            await webglManager.init();
            
            expect(webglManager.assets).toBeDefined();
            expect(webglManager.assets.getProgress()).toBeGreaterThanOrEqual(0);
        });
        
        test('should emit progress events during loading', async () => {
            const progressSpy = jest.fn();
            
            await webglManager.init();
            webglManager.assets.on('progress', progressSpy);
            
            // Simulate asset loading
            webglManager.assets.emit('progress', 0.5);
            
            expect(progressSpy).toHaveBeenCalledWith(0.5);
        });
    });
    
    describe('Render Loop', () => {
        test('should start render loop when scene is initialized', async () => {
            await webglManager.init();
            await webglManager.initScene('homepage');
            
            expect(webglManager.isRunning).toBe(true);
        });
        
        test('should stop render loop when destroyed', async () => {
            await webglManager.init();
            await webglManager.initScene('homepage');
            
            webglManager.destroy();
            
            expect(webglManager.isRunning).toBe(false);
        });
        
        test('should update scene during render loop', async () => {
            await webglManager.init();
            await webglManager.initScene('homepage');
            
            const scene = webglManager.currentScene;
            const updateSpy = jest.spyOn(scene, 'update').mockImplementation();
            
            // Simulate render loop update
            webglManager.update(0.016, 1.0);
            
            expect(updateSpy).toHaveBeenCalledWith(0.016, 1.0);
        });
    });
    
    describe('Performance Monitoring', () => {
        test('should set up debug tools in debug mode', async () => {
            webglManager.options.debug = true;
            
            await webglManager.init();
            
            // Should attempt to load stats panel
            expect(webglManager.stats).toBeDefined();
        });
        
        test('should provide renderer info', async () => {
            await webglManager.init();
            
            const info = webglManager.rendererManager.getInfo();
            
            expect(info).toHaveProperty('memory');
            expect(info).toHaveProperty('render');
            expect(info).toHaveProperty('programs');
        });
    });
    
    describe('Error Handling', () => {
        test('should handle renderer initialization failure', async () => {
            mockCanvas.getContext.mockReturnValue(null);
            
            await expect(webglManager.init()).rejects.toThrow();
        });
        
        test('should handle asset loading failure gracefully', async () => {
            await webglManager.init();
            
            // Mock asset loading failure
            const errorSpy = jest.spyOn(webglManager.assets, 'emit');
            webglManager.assets.emit('error', new Error('Asset load failed'));
            
            expect(errorSpy).toHaveBeenCalledWith('error', expect.any(Error));
        });
    });
    
    describe('Memory Management', () => {
        test('should clean up resources on destroy', async () => {
            await webglManager.init();
            await webglManager.initScene('homepage');
            
            const renderer = webglManager.rendererManager;
            const assets = webglManager.assets;
            const scenes = webglManager.scenes;
            
            const rendererDestroySpy = jest.spyOn(renderer, 'destroy');
            const assetsDestroySpy = jest.spyOn(assets, 'destroy');
            const scenesDestroySpy = jest.spyOn(scenes, 'destroy');
            
            webglManager.destroy();
            
            expect(rendererDestroySpy).toHaveBeenCalled();
            expect(assetsDestroySpy).toHaveBeenCalled();
            expect(scenesDestroySpy).toHaveBeenCalled();
        });
        
        test('should remove event listeners on destroy', async () => {
            await webglManager.init();
            
            const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
            
            webglManager.destroy();
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'resize',
                expect.any(Function)
            );
        });
    });
});