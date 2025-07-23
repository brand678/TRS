/**
 * TRANSLINK - Theme Store
 * Enhanced theme storage and management
 */

import { EventEmitter } from '../utils/EventEmitter.js'
import { Logger } from '../utils/Logger.js'

/**
 * Default theme configuration
 */
const DEFAULT_THEME = {
    name: "Default",
    version: "2.0",
    ui: {
        // Base colors
        background: "#050D15",
        text: "#ffffff",
        brand: "#050D15",
        lightBlue: "#EEF6FF",
        
        // Navigation
        menuBackground: "rgba(5, 13, 21, 0.9)",
        menuBorder: "rgba(255, 255, 255, 0.1)",
        menuText: "#ffffff",
        
        // Interactive elements
        buttonBackground: "#41a5ff",
        buttonHover: "#3a94e6",
        buttonText: "#ffffff",
        
        // Form elements
        inputBackground: "rgba(255, 255, 255, 0.1)",
        inputBorder: "rgba(255, 255, 255, 0.2)",
        inputText: "#ffffff",
        inputPlaceholder: "rgba(255, 255, 255, 0.6)",
        
        // Accents and highlights
        accent: "#41a5ff",
        accentLight: "#abd7ff",
        highlight: "#8affff",
    },
    "3d": {
        // 3D scene colors
        sceneBackground: "#133153",
        fresnelColor: "#60b2ff",
        envColor: "#182d3d",
        coreColor: "#bec0fe",
        tubeColor: "#b2e0ff",
        touchpadBaseColor: "#b4dee7",
        touchpadCornersColor: "#8bccda",
        touchpadVisualizerColor: "#60b2ff",
    }
};

/**
 * Preset themes
 */
const PRESET_THEMES = [
    {
        name: "Dark",
        version: "2.0",
        ui: {
            background: "#000000",
            text: "#ffffff",
            brand: "#000000",
            lightBlue: "#1a1a2e",
            menuBackground: "rgba(26, 26, 46, 0.9)",
            menuBorder: "rgba(255, 255, 255, 0.1)",
            menuText: "#ffffff",
            buttonBackground: "#4361ee",
            buttonHover: "#3a0ca3",
            buttonText: "#ffffff",
            inputBackground: "rgba(255, 255, 255, 0.1)",
            inputBorder: "rgba(255, 255, 255, 0.2)",
            inputText: "#ffffff",
            inputPlaceholder: "rgba(255, 255, 255, 0.6)",
            accent: "#4361ee",
            accentLight: "#4895ef",
            highlight: "#4cc9f0",
        },
        "3d": {
            sceneBackground: "#000000",
            fresnelColor: "#4361ee",
            envColor: "#0a0a1c",
            coreColor: "#4cc9f0",
            tubeColor: "#4895ef",
            touchpadBaseColor: "#4361ee",
            touchpadCornersColor: "#3a0ca3",
            touchpadVisualizerColor: "#4cc9f0",
        }
    },
    {
        name: "Light",
        version: "2.0",
        ui: {
            background: "#ffffff",
            text: "#1a1a2e",
            brand: "#f8f9fa",
            lightBlue: "#e9ecef",
            menuBackground: "rgba(248, 249, 250, 0.9)",
            menuBorder: "rgba(0, 0, 0, 0.1)",
            menuText: "#212529",
            buttonBackground: "#4361ee",
            buttonHover: "#3a0ca3",
            buttonText: "#ffffff",
            inputBackground: "rgba(0, 0, 0, 0.05)",
            inputBorder: "rgba(0, 0, 0, 0.1)",
            inputText: "#212529",
            inputPlaceholder: "rgba(0, 0, 0, 0.6)",
            accent: "#4361ee",
            accentLight: "#4895ef",
            highlight: "#4cc9f0",
        },
        "3d": {
            sceneBackground: "#e9ecef",
            fresnelColor: "#4361ee",
            envColor: "#dee2e6",
            coreColor: "#4cc9f0",
            tubeColor: "#4895ef",
            touchpadBaseColor: "#4361ee",
            touchpadCornersColor: "#3a0ca3",
            touchpadVisualizerColor: "#4cc9f0",
        }
    }
];

/**
 * ThemeStore - Manages theme data and persistence
 */
export class ThemeStore extends EventEmitter {
    constructor() {
        super();
        
        this.logger = new Logger('ThemeStore');
        
        // Storage
        this.storageKey = 'translink-theme';
        this.currentTheme = null;
        this.availableThemes = new Map();
        
        this.logger.info('ThemeStore created');
    }

    /**
     * Initialize theme store
     */
    async init() {
        try {
            this.logger.info('Initializing ThemeStore...');
            
            // Register default and preset themes
            this.registerTheme(DEFAULT_THEME);
            PRESET_THEMES.forEach(theme => this.registerTheme(theme));
            
            // Load saved theme or use default
            this.loadSavedTheme();
            
            this.logger.info('ThemeStore initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize ThemeStore:', error);
            throw error;
        }
    }

    /**
     * Register a theme
     */
    registerTheme(theme) {
        if (!this.validateTheme(theme)) {
            this.logger.error('Invalid theme:', theme);
            return false;
        }
        
        this.availableThemes.set(theme.name, { ...theme });
        this.logger.debug(`Registered theme: ${theme.name}`);
        
        return true;
    }

    /**
     * Validate theme structure
     */
    validateTheme(theme) {
        if (!theme || typeof theme !== 'object') {
            return false;
        }
        
        if (!theme.name || !theme.version || !theme.ui) {
            return false;
        }
        
        // Check required UI colors
        const requiredUIColors = ['background', 'text', 'accent'];
        for (const color of requiredUIColors) {
            if (!theme.ui[color]) {
                this.logger.warn(`Missing required UI color: ${color}`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Load saved theme from localStorage
     */
    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem(this.storageKey);
            
            if (savedTheme) {
                const theme = JSON.parse(savedTheme);
                
                if (this.validateTheme(theme)) {
                    this.currentTheme = theme;
                    this.logger.info(`Loaded saved theme: ${theme.name}`);
                    return;
                }
            }
        } catch (error) {
            this.logger.warn('Failed to load saved theme:', error);
        }
        
        // Fallback to default theme
        this.currentTheme = { ...DEFAULT_THEME };
        this.logger.info('Using default theme');
    }

    /**
     * Save current theme to localStorage
     */
    saveTheme() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentTheme));
            this.logger.debug('Theme saved to localStorage');
        } catch (error) {
            this.logger.error('Failed to save theme:', error);
        }
    }

    /**
     * Set current theme
     */
    setCurrentTheme(theme) {
        if (!this.validateTheme(theme)) {
            this.logger.error('Invalid theme provided');
            return false;
        }
        
        this.currentTheme = { ...theme };
        this.saveTheme();
        
        this.emit('theme:changed', this.currentTheme);
        this.logger.info(`Theme changed to: ${theme.name}`);
        
        return true;
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme ? { ...this.currentTheme } : null;
    }

    /**
     * Get theme by name
     */
    getTheme(name) {
        return this.availableThemes.has(name) ? 
               { ...this.availableThemes.get(name) } : null;
    }

    /**
     * Get all available themes
     */
    getAvailableThemes() {
        return Array.from(this.availableThemes.values()).map(theme => ({ ...theme }));
    }

    /**
     * Update a color in the current theme
     */
    updateColor(section, colorKey, value) {
        if (!this.currentTheme || !this.currentTheme[section]) {
            this.logger.error(`Invalid theme section: ${section}`);
            return false;
        }
        
        this.currentTheme[section][colorKey] = value;
        this.saveTheme();
        
        this.emit('theme:changed', this.currentTheme);
        this.logger.debug(`Updated ${section}.${colorKey} to ${value}`);
        
        return true;
    }

    /**
     * Reset to default theme
     */
    resetToDefault() {
        this.currentTheme = { ...DEFAULT_THEME };
        this.saveTheme();
        
        this.emit('theme:changed', this.currentTheme);
        this.logger.info('Reset to default theme');
    }

    /**
     * Export current theme as JSON
     */
    exportTheme() {
        if (!this.currentTheme) {
            this.logger.error('No current theme to export');
            return null;
        }
        
        const themeData = JSON.stringify(this.currentTheme, null, 2);
        const blob = new Blob([themeData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.logger.info('Theme exported');
        return themeData;
    }

    /**
     * Import theme from JSON
     */
    importTheme(themeData) {
        try {
            const theme = typeof themeData === 'string' ? 
                         JSON.parse(themeData) : themeData;
            
            if (!this.validateTheme(theme)) {
                throw new Error('Invalid theme format');
            }
            
            this.setCurrentTheme(theme);
            this.logger.info(`Imported theme: ${theme.name}`);
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to import theme:', error);
            return false;
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying ThemeStore...');
        
        this.availableThemes.clear();
        this.currentTheme = null;
        
        this.removeAllListeners();
        this.logger.info('ThemeStore destroyed');
    }
}