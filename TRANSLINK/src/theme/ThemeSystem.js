/**
 * TRANSLINK - Theme System
 * Enhanced theme management with WebGL integration
 */

import { EventEmitter } from '../utils/EventEmitter.js'
import { Logger } from '../utils/Logger.js'
import { ThemeStore } from './ThemeStore.js'
import { ThemeUpdater } from './ThemeUpdater.js'

/**
 * ThemeSystem - Central theme management and coordination
 */
export class ThemeSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('ThemeSystem');
        this.options = {
            debug: false,
            ...options
        };
        
        // Core components
        this.store = null;
        this.updater = null;
        this.webgl = null;
        
        // State
        this.isInitialized = false;
        this.currentTheme = null;
        
        this.logger.info('ThemeSystem created');
    }

    /**
     * Initialize theme system
     */
    async init() {
        try {
            this.logger.info('Initializing ThemeSystem...');
            
            // Initialize theme store
            this.store = new ThemeStore();
            await this.store.init();
            
            // Get current theme
            this.currentTheme = this.store.getCurrentTheme();
            
            // Apply initial theme
            this.applyTheme(this.currentTheme);
            
            // Set up theme change listener
            this.store.on('theme:changed', (theme) => {
                this.handleThemeChange(theme);
            });
            
            this.isInitialized = true;
            this.emit('theme:initialized');
            
            this.logger.info('ThemeSystem initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize ThemeSystem:', error);
            throw error;
        }
    }

    /**
     * Connect WebGL system for 3D theme updates
     */
    connectWebGL(webgl) {
        this.logger.info('Connecting WebGL to theme system...');
        
        this.webgl = webgl;
        
        // Initialize theme updater for WebGL
        if (!this.updater) {
            this.updater = new ThemeUpdater({
                webgl: this.webgl,
                debug: this.options.debug
            });
        } else {
            this.updater.setWebGL(this.webgl);
        }
        
        // Apply current theme to WebGL
        if (this.currentTheme) {
            this.updater.updateWebGL(this.currentTheme);
        }
        
        this.emit('webgl:connected', this.webgl);
    }

    /**
     * Handle theme change
     */
    handleThemeChange(theme) {
        this.logger.info(`Theme changed to: ${theme.name}`);
        
        this.currentTheme = theme;
        
        // Apply theme to DOM
        this.applyTheme(theme);
        
        // Update WebGL if connected
        if (this.updater && this.webgl) {
            this.updater.updateWebGL(theme);
        }
        
        this.emit('theme:changed', theme);
    }

    /**
     * Apply theme to DOM
     */
    applyTheme(theme) {
        if (!theme || !theme.ui) {
            this.logger.error('Invalid theme object:', theme);
            return;
        }
        
        this.logger.debug(`Applying theme: ${theme.name}`);
        
        // Apply UI colors as CSS variables
        Object.entries(theme.ui).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--color-${key}`, value);
        });
        
        // Apply 3D colors as CSS variables (for potential UI use)
        if (theme['3d']) {
            Object.entries(theme['3d']).forEach(([key, value]) => {
                document.documentElement.style.setProperty(`--color-3d-${key}`, value);
            });
        }
        
        // Update theme attribute
        document.documentElement.setAttribute('data-theme', theme.name.toLowerCase());
        
        this.emit('theme:applied', theme);
    }

    /**
     * Set theme by name
     */
    setTheme(themeName) {
        if (!this.store) {
            this.logger.error('Theme store not initialized');
            return;
        }
        
        const theme = this.store.getTheme(themeName);
        if (!theme) {
            this.logger.error(`Theme not found: ${themeName}`);
            return;
        }
        
        this.store.setCurrentTheme(theme);
    }

    /**
     * Update theme color
     */
    updateColor(section, colorKey, value) {
        if (!this.store) {
            this.logger.error('Theme store not initialized');
            return;
        }
        
        this.store.updateColor(section, colorKey, value);
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Get available themes
     */
    getAvailableThemes() {
        return this.store ? this.store.getAvailableThemes() : [];
    }

    /**
     * Export current theme
     */
    exportTheme() {
        if (!this.store) {
            this.logger.error('Theme store not initialized');
            return;
        }
        
        return this.store.exportTheme();
    }

    /**
     * Import theme from JSON
     */
    importTheme(themeData) {
        if (!this.store) {
            this.logger.error('Theme store not initialized');
            return false;
        }
        
        return this.store.importTheme(themeData);
    }

    /**
     * Reset to default theme
     */
    resetToDefault() {
        if (!this.store) {
            this.logger.error('Theme store not initialized');
            return;
        }
        
        this.store.resetToDefault();
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying ThemeSystem...');
        
        if (this.updater) {
            this.updater.destroy();
        }
        
        if (this.store) {
            this.store.destroy();
        }
        
        this.removeAllListeners();
        this.isInitialized = false;
        
        this.logger.info('ThemeSystem destroyed');
    }
}