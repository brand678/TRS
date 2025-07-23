/**
 * TRANSLINK - Application Core
 * Central application logic and system coordination
 */

import { EventEmitter } from '../utils/EventEmitter.js'
import { WebGLManager } from '../webgl/WebGLManager.js'
import { ModuleManager } from '../modules/ModuleManager.js'
import { AudioManager } from '../audio/AudioManager.js'
import { Logger } from '../utils/Logger.js'

/**
 * ApplicationCore - Central coordination of all application systems
 */
export class ApplicationCore extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('ApplicationCore');
        this.options = {
            debug: false,
            themeSystem: null,
            ...options
        };
        
        // System managers
        this.webgl = null;
        this.modules = null;
        this.audio = null;
        
        // State
        this.isInitialized = false;
        this.currentPage = this.getCurrentPage();
        
        this.logger.info('ApplicationCore created');
    }

    /**
     * Initialize the application core
     */
    async init() {
        try {
            this.logger.info('Initializing ApplicationCore...');
            
            // Initialize systems in order
            await this.initWebGL();
            await this.initAudio();
            await this.initModules();
            
            // Set up page routing
            this.setupRouting();
            
            // Set up global event listeners
            this.setupEventListeners();
            
            // Initialize current page
            await this.initCurrentPage();
            
            this.isInitialized = true;
            this.emit('core:initialized');
            
            this.logger.info('ApplicationCore initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize ApplicationCore:', error);
            throw error;
        }
    }

    /**
     * Initialize WebGL system
     */
    async initWebGL() {
        this.logger.info('Initializing WebGL system...');
        
        try {
            this.webgl = new WebGLManager({
                canvas: '[data-webgl-canvas]',
                debug: this.options.debug,
                themeSystem: this.options.themeSystem
            });
            
            await this.webgl.init();
            
            // Connect theme system to WebGL
            if (this.options.themeSystem) {
                this.options.themeSystem.connectWebGL(this.webgl);
            }
            
            this.emit('webgl:initialized', this.webgl);
            
        } catch (error) {
            this.logger.error('Failed to initialize WebGL:', error);
            throw error;
        }
    }

    /**
     * Initialize audio system
     */
    async initAudio() {
        this.logger.info('Initializing audio system...');
        
        try {
            this.audio = new AudioManager({
                debug: this.options.debug
            });
            
            await this.audio.init();
            
            this.emit('audio:initialized', this.audio);
            
        } catch (error) {
            this.logger.error('Failed to initialize audio:', error);
            // Audio is not critical, continue without it
            this.logger.warn('Continuing without audio system');
        }
    }

    /**
     * Initialize module system
     */
    async initModules() {
        this.logger.info('Initializing module system...');
        
        try {
            this.modules = new ModuleManager({
                debug: this.options.debug,
                webgl: this.webgl,
                audio: this.audio,
                themeSystem: this.options.themeSystem
            });
            
            await this.modules.init();
            
            this.emit('modules:initialized', this.modules);
            
        } catch (error) {
            this.logger.error('Failed to initialize modules:', error);
            throw error;
        }
    }

    /**
     * Set up page routing
     */
    setupRouting() {
        this.logger.info('Setting up routing...');
        
        // Listen for page changes
        window.addEventListener('popstate', () => {
            this.handlePageChange();
        });
        
        // Override link clicks for SPA navigation
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && this.shouldInterceptLink(link)) {
                e.preventDefault();
                this.navigateTo(link.href);
            }
        });
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Resize handling
        window.addEventListener('resize', () => {
            this.emit('app:resize');
        });
        
        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            this.emit('app:visibility-change', !document.hidden);
        });
        
        // Focus/blur handling
        window.addEventListener('focus', () => {
            this.emit('app:focus');
        });
        
        window.addEventListener('blur', () => {
            this.emit('app:blur');
        });
    }

    /**
     * Initialize current page
     */
    async initCurrentPage() {
        const page = this.getCurrentPage();
        this.logger.info(`Initializing page: ${page}`);
        
        try {
            // Initialize WebGL scene for current page
            if (this.webgl) {
                await this.webgl.initScene(page);
            }
            
            // Initialize modules for current page
            if (this.modules) {
                await this.modules.initForPage(page);
            }
            
            this.emit('page:initialized', page);
            
        } catch (error) {
            this.logger.error(`Failed to initialize page ${page}:`, error);
            throw error;
        }
    }

    /**
     * Get current page from URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        
        switch (path) {
            case '/':
                return 'homepage';
            case '/specs':
                return 'specs';
            case '/preorder':
                return 'preorder';
            case '/settings':
                return 'settings';
            case '/fwa':
                return 'fwa';
            default:
                return 'homepage';
        }
    }

    /**
     * Handle page changes
     */
    async handlePageChange() {
        const newPage = this.getCurrentPage();
        
        if (newPage === this.currentPage) {
            return;
        }
        
        this.logger.info(`Page change: ${this.currentPage} → ${newPage}`);
        
        try {
            // Emit page leave event
            this.emit('page:leave', this.currentPage);
            
            // Transition to new page
            await this.transitionToPage(newPage);
            
            // Update current page
            this.currentPage = newPage;
            
            // Emit page enter event
            this.emit('page:enter', newPage);
            
        } catch (error) {
            this.logger.error(`Failed to change page to ${newPage}:`, error);
        }
    }

    /**
     * Transition to a new page
     */
    async transitionToPage(page) {
        this.logger.info(`Transitioning to page: ${page}`);
        
        try {
            // WebGL scene transition
            if (this.webgl) {
                await this.webgl.transitionToScene(page);
            }
            
            // Module page transition
            if (this.modules) {
                await this.modules.transitionToPage(page);
            }
            
            this.emit('page:transition-complete', page);
            
        } catch (error) {
            this.logger.error(`Failed to transition to page ${page}:`, error);
            throw error;
        }
    }

    /**
     * Navigate to a URL
     */
    async navigateTo(url) {
        this.logger.info(`Navigating to: ${url}`);
        
        try {
            // Update browser history
            history.pushState({}, '', url);
            
            // Handle page change
            await this.handlePageChange();
            
        } catch (error) {
            this.logger.error(`Failed to navigate to ${url}:`, error);
        }
    }

    /**
     * Check if link should be intercepted for SPA navigation
     */
    shouldInterceptLink(link) {
        const href = link.getAttribute('href');
        
        // Don't intercept external links
        if (href.startsWith('http') || href.startsWith('//')) {
            return false;
        }
        
        // Don't intercept links with target="_blank"
        if (link.getAttribute('target') === '_blank') {
            return false;
        }
        
        // Don't intercept links with data-no-intercept
        if (link.hasAttribute('data-no-intercept')) {
            return false;
        }
        
        return true;
    }

    /**
     * Get system manager by name
     */
    getSystem(name) {
        switch (name) {
            case 'webgl':
                return this.webgl;
            case 'audio':
                return this.audio;
            case 'modules':
                return this.modules;
            case 'theme':
                return this.options.themeSystem;
            default:
                this.logger.warn(`Unknown system: ${name}`);
                return null;
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying ApplicationCore...');
        
        // Destroy systems
        if (this.modules) {
            this.modules.destroy();
        }
        
        if (this.audio) {
            this.audio.destroy();
        }
        
        if (this.webgl) {
            this.webgl.destroy();
        }
        
        // Remove event listeners
        this.removeAllListeners();
        
        this.isInitialized = false;
        this.logger.info('ApplicationCore destroyed');
    }
}