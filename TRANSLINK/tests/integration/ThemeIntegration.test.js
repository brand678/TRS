/**
 * TRANSLINK - Theme Integration Tests
 */

import { ThemeSystem } from '../../src/theme/ThemeSystem.js';
import { WebGLManager } from '../../src/webgl/WebGLManager.js';

// Mock DOM
Object.defineProperty(document, 'documentElement', {
    value: {
        style: {
            setProperty: jest.fn(),
            removeProperty: jest.fn()
        },
        setAttribute: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        }
    },
    writable: true
});

Object.defineProperty(document, 'querySelector', {
    value: jest.fn(() => ({
        getContext: jest.fn(() => ({})),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    })),
    writable: true
});

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
});

describe('Theme Integration', () => {
    let themeSystem;
    let webglManager;
    
    beforeEach(async () => {
        jest.clearAllMocks();
        
        themeSystem = new ThemeSystem();
        await themeSystem.init();
    });
    
    afterEach(() => {
        if (themeSystem) {
            themeSystem.destroy();
        }
        if (webglManager) {
            webglManager.destroy();
        }
    });
    
    describe('Theme System Initialization', () => {
        test('should initialize with default theme', async () => {
            const currentTheme = themeSystem.getCurrentTheme();
            
            expect(currentTheme).toBeDefined();
            expect(currentTheme.name).toBe('Default');
            expect(currentTheme.ui).toBeDefined();
            expect(currentTheme['3d']).toBeDefined();
        });
        
        test('should apply theme to CSS variables', async () => {
            const theme = themeSystem.getCurrentTheme();
            
            // Check that CSS variables were set
            Object.keys(theme.ui).forEach(key => {
                expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
                    `--color-${key}`,
                    theme.ui[key]
                );
            });
        });
        
        test('should load saved theme from localStorage', async () => {
            const savedTheme = {
                name: 'Custom',
                version: '2.0',
                ui: { background: '#000000', text: '#ffffff' },
                '3d': { sceneBackground: '#111111' }
            };
            
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTheme));
            
            const newThemeSystem = new ThemeSystem();
            await newThemeSystem.init();
            
            const currentTheme = newThemeSystem.getCurrentTheme();
            expect(currentTheme.name).toBe('Custom');
            
            newThemeSystem.destroy();
        });
    });
    
    describe('Theme Changes', () => {
        test('should update CSS variables when theme changes', () => {
            const newColor = '#ff0000';
            
            themeSystem.updateColor('ui', 'background', newColor);
            
            expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
                '--color-background',
                newColor
            );
        });
        
        test('should save theme changes to localStorage', () => {
            themeSystem.updateColor('ui', 'background', '#ff0000');
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'translink-theme',
                expect.stringContaining('#ff0000')
            );
        });
        
        test('should emit theme change events', () => {
            const changeHandler = jest.fn();
            themeSystem.on('theme:changed', changeHandler);
            
            themeSystem.setTheme('Dark');
            
            expect(changeHandler).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Dark' })
            );
        });
    });
    
    describe('WebGL Integration', () => {
        beforeEach(async () => {
            webglManager = new WebGLManager({
                canvas: '[data-webgl-canvas]',
                themeSystem: themeSystem
            });
            
            // Mock WebGL initialization
            webglManager.canvas = { getContext: jest.fn(() => ({})) };
            webglManager.renderer = { 
                instance: { 
                    setPixelRatio: jest.fn(),
                    setSize: jest.fn(),
                    render: jest.fn()
                }
            };
            webglManager.assets = { 
                init: jest.fn().mockResolvedValue(),
                on: jest.fn()
            };
            webglManager.scenes = { 
                init: jest.fn().mockResolvedValue(),
                updateTheme: jest.fn()
            };
        });
        
        test('should connect theme system to WebGL', async () => {
            themeSystem.connectWebGL(webglManager);
            
            expect(themeSystem.webgl).toBe(webglManager);
            expect(themeSystem.updater).toBeDefined();
        });
        
        test('should update WebGL materials when theme changes', async () => {
            themeSystem.connectWebGL(webglManager);
            
            const updateSpy = jest.spyOn(themeSystem.updater, 'updateWebGL');
            
            themeSystem.setTheme('Dark');
            
            expect(updateSpy).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Dark' })
            );
        });
        
        test('should handle WebGL connection without existing updater', () => {
            expect(() => {
                themeSystem.connectWebGL(webglManager);
            }).not.toThrow();
            
            expect(themeSystem.updater).toBeDefined();
        });
    });
    
    describe('Theme Operations', () => {
        test('should get available themes', () => {
            const themes = themeSystem.getAvailableThemes();
            
            expect(Array.isArray(themes)).toBe(true);
            expect(themes.length).toBeGreaterThan(0);
            expect(themes[0]).toHaveProperty('name');
            expect(themes[0]).toHaveProperty('ui');
            expect(themes[0]).toHaveProperty('3d');
        });
        
        test('should export theme', () => {
            // Mock URL and link creation
            const mockLink = {
                href: '',
                download: '',
                click: jest.fn()
            };
            
            const createElementSpy = jest.spyOn(document, 'createElement')
                .mockReturnValue(mockLink);
            const appendChildSpy = jest.spyOn(document.body, 'appendChild')
                .mockImplementation();
            const removeChildSpy = jest.spyOn(document.body, 'removeChild')
                .mockImplementation();
            
            global.URL.createObjectURL = jest.fn(() => 'blob:url');
            global.URL.revokeObjectURL = jest.fn();
            
            themeSystem.exportTheme();
            
            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(mockLink.click).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
            
            createElementSpy.mockRestore();
            appendChildSpy.mockRestore();
            removeChildSpy.mockRestore();
        });
        
        test('should import valid theme', () => {
            const validTheme = {
                name: 'Imported',
                version: '2.0',
                ui: { background: '#123456', text: '#ffffff' },
                '3d': { sceneBackground: '#654321' }
            };
            
            const result = themeSystem.importTheme(JSON.stringify(validTheme));
            
            expect(result).toBe(true);
            expect(themeSystem.getCurrentTheme().name).toBe('Imported');
        });
        
        test('should reject invalid theme', () => {
            const invalidTheme = { name: 'Invalid' }; // Missing required properties
            
            const result = themeSystem.importTheme(JSON.stringify(invalidTheme));
            
            expect(result).toBe(false);
        });
        
        test('should reset to default theme', () => {
            // Change theme first
            themeSystem.setTheme('Dark');
            expect(themeSystem.getCurrentTheme().name).toBe('Dark');
            
            // Reset to default
            themeSystem.resetToDefault();
            expect(themeSystem.getCurrentTheme().name).toBe('Default');
        });
    });
    
    describe('Error Handling', () => {
        test('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            
            expect(() => {
                themeSystem.updateColor('ui', 'background', '#ff0000');
            }).not.toThrow();
        });
        
        test('should handle invalid JSON in localStorage', async () => {
            localStorageMock.getItem.mockReturnValue('invalid json');
            
            const newThemeSystem = new ThemeSystem();
            await newThemeSystem.init();
            
            // Should fall back to default theme
            expect(newThemeSystem.getCurrentTheme().name).toBe('Default');
            
            newThemeSystem.destroy();
        });
        
        test('should handle missing WebGL gracefully', () => {
            expect(() => {
                themeSystem.connectWebGL(null);
            }).not.toThrow();
        });
    });
    
    describe('Performance', () => {
        test('should debounce rapid theme changes', (done) => {
            const updateSpy = jest.fn();
            themeSystem.on('theme:applied', updateSpy);
            
            // Rapid theme changes
            themeSystem.updateColor('ui', 'background', '#ff0000');
            themeSystem.updateColor('ui', 'background', '#00ff00');
            themeSystem.updateColor('ui', 'background', '#0000ff');
            
            // Should only apply final change
            setTimeout(() => {
                expect(themeSystem.getCurrentTheme().ui.background).toBe('#0000ff');
                done();
            }, 100);
        });
        
        test('should not leak memory with many theme changes', () => {
            const initialListenerCount = themeSystem.eventNames().length;
            
            // Perform many theme operations
            for (let i = 0; i < 100; i++) {
                themeSystem.updateColor('ui', 'background', `#${i.toString(16).padStart(6, '0')}`);
            }
            
            // Should not accumulate listeners
            expect(themeSystem.eventNames().length).toBe(initialListenerCount);
        });
    });
});