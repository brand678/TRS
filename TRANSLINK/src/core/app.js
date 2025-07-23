/**
 * TRANSLINK - Core Application
 * Refactored main application entry point with improved architecture
 */

import WebGL from 'three/addons/capabilities/WebGL.js'
import { ApplicationCore } from './ApplicationCore.js'
import { ThemeSystem } from '../theme/ThemeSystem.js'
import { Logger } from '../utils/Logger.js'

// Global application instance
window.TranslinkApp = window.TranslinkApp || {};

/**
 * Main Application Class
 * Handles application initialization, WebGL setup, and core systems
 */
export class TranslinkApplication {
    constructor() {
        this.logger = new Logger('TranslinkApp');
        this.isInitialized = false;
        this.core = null;
        this.themeSystem = null;
        
        // Initialize application
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.logger.info('Initializing Translink Application...');
            
            // Check WebGL support
            if (!this.checkWebGLSupport()) {
                this.initFallback();
                return;
            }

            // Initialize core systems
            await this.initCoreSystems();
            
            // Initialize theme system
            await this.initThemeSystem();
            
            // Initialize application core
            await this.initApplicationCore();
            
            // Mark as ready
            this.markAsReady();
            
            this.logger.info('Translink Application initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize application:', error);
            this.initFallback();
        }
    }

    /**
     * Check WebGL support
     */
    checkWebGLSupport() {
        if (WebGL.isWebGL2Available()) {
            this.logger.info('WebGL 2.0 support detected');
            return true;
        } else if (WebGL.isWebGLAvailable()) {
            this.logger.warn('Only WebGL 1.0 support detected');
            return true;
        } else {
            this.logger.error('WebGL not supported');
            return false;
        }
    }

    /**
     * Initialize core systems
     */
    async initCoreSystems() {
        this.logger.info('Initializing core systems...');
        
        // Set URL parameters for debugging
        this.urlParams = new URLSearchParams(window.location.search);
        this.isDebug = this.urlParams.has('debug');
        
        if (this.isDebug) {
            this.logger.info('Debug mode enabled');
        }

        // Prevent scroll restoration
        history.scrollRestoration = 'manual';
        
        // Add loaded class to document
        document.documentElement.classList.add('translink-loaded');
    }

    /**
     * Initialize theme system
     */
    async initThemeSystem() {
        this.logger.info('Initializing theme system...');
        
        try {
            this.themeSystem = new ThemeSystem();
            await this.themeSystem.init();
            
            // Make theme system globally available
            window.TranslinkApp.themeSystem = this.themeSystem;
            
        } catch (error) {
            this.logger.error('Failed to initialize theme system:', error);
            throw error;
        }
    }

    /**
     * Initialize application core
     */
    async initApplicationCore() {
        this.logger.info('Initializing application core...');
        
        try {
            this.core = new ApplicationCore({
                debug: this.isDebug,
                themeSystem: this.themeSystem
            });
            
            await this.core.init();
            
            // Make core globally available
            window.TranslinkApp.core = this.core;
            
        } catch (error) {
            this.logger.error('Failed to initialize application core:', error);
            throw error;
        }
    }

    /**
     * Mark application as ready
     */
    markAsReady() {
        document.documentElement.classList.add('translink-ready');
        this.isInitialized = true;
        
        // Dispatch ready event
        const readyEvent = new CustomEvent('translink:ready', {
            detail: { app: this }
        });
        document.dispatchEvent(readyEvent);
        
        this.logger.info('Application marked as ready');
    }

    /**
     * Initialize fallback for unsupported browsers
     */
    initFallback() {
        this.logger.warn('Initializing fallback mode');
        
        document.documentElement.classList.add('translink-fallback');
        
        // Show fallback message
        const fallbackMessage = document.createElement('div');
        fallbackMessage.className = 'fallback-message';
        fallbackMessage.innerHTML = `
            <h1>Browser Not Supported</h1>
            <p>This experience requires a modern browser with WebGL support.</p>
            <p>Please update your browser or try a different one.</p>
        `;
        
        document.body.appendChild(fallbackMessage);
    }

    /**
     * Get application instance
     */
    static getInstance() {
        if (!window.TranslinkApp.instance) {
            window.TranslinkApp.instance = new TranslinkApplication();
        }
        return window.TranslinkApp.instance;
    }
}

// Auto-initialize application
const app = TranslinkApplication.getInstance();

// Welcome message
setTimeout(() => {
    const baseStyle = 'background-color: #0D1B2A; color: #41A5FF; font: 400 1em monospace; padding: 0.5em 0;'
    const boldStyle = 'background-color: #0D1B2A; color: #41A5FF; font: 700 1em monospace; padding: 0.5em 0;'

    console.log('%c TRANSLINK EARBUDS %c > Refactored Architecture', boldStyle, baseStyle);
    console.log('%c Built by OFF+BRAND %c > Enhanced Experience', baseStyle, '');
}, 500);

export default app;