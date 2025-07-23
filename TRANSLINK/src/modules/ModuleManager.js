/**
 * TRANSLINK - Module Manager
 * Centralized management of application modules
 */

import { EventEmitter } from '../utils/EventEmitter.js'
import { Logger } from '../utils/Logger.js'

/**
 * ModuleManager - Handles initialization and coordination of application modules
 */
export class ModuleManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('ModuleManager');
        this.options = {
            debug: false,
            webgl: null,
            audio: null,
            themeSystem: null,
            ...options
        };
        
        // Module registry
        this.modules = new Map();
        this.moduleInstances = new Map();
        
        // State
        this.isInitialized = false;
        this.currentPage = null;
        
        this.logger.info('ModuleManager created');
    }

    /**
     * Initialize module manager
     */
    async init() {
        try {
            this.logger.info('Initializing ModuleManager...');
            
            // Register core modules
            this.registerCoreModules();
            
            // Initialize DOM-based modules
            this.initDOMModules();
            
            this.isInitialized = true;
            this.emit('modules:initialized');
            
            this.logger.info('ModuleManager initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize ModuleManager:', error);
            throw error;
        }
    }

    /**
     * Register core modules
     */
    registerCoreModules() {
        // Navigation module
        this.registerModule('navigation', () => import('./navigation/NavigationModule.js'));
        
        // Audio controls
        this.registerModule('audio-toggle', () => import('./audio/AudioToggleModule.js'));
        
        // Loader
        this.registerModule('loader', () => import('./loader/LoaderModule.js'));
        
        // UI modules
        this.registerModule('cursor', () => import('./ui/CursorModule.js'));
        this.registerModule('modal', () => import('./ui/ModalModule.js'));
        this.registerModule('accordion', () => import('./ui/AccordionModule.js'));
        
        // Page-specific modules
        this.registerModule('translink-ai', () => import('./ai/TranslinkAIModule.js'));
        this.registerModule('progress-indicator', () => import('./ui/ProgressModule.js'));
        
        this.logger.info(`Registered ${this.modules.size} core modules`);
    }

    /**
     * Register a module
     */
    registerModule(name, moduleLoader) {
        if (this.modules.has(name)) {
            this.logger.warn(`Module ${name} already registered`);
            return;
        }
        
        this.modules.set(name, {
            name,
            loader: moduleLoader,
            loaded: false,
            instance: null
        });
        
        this.logger.debug(`Registered module: ${name}`);
    }

    /**
     * Initialize DOM-based modules
     */
    initDOMModules() {
        // Find all elements with data-module attribute
        const moduleElements = document.querySelectorAll('[data-module]');
        
        this.logger.info(`Found ${moduleElements.length} DOM module elements`);
        
        moduleElements.forEach(element => {
            const moduleName = element.dataset.module;
            if (moduleName) {
                this.initModule(moduleName, element);
            }
        });
    }

    /**
     * Initialize a specific module
     */
    async initModule(name, element = null) {
        try {
            if (!this.modules.has(name)) {
                this.logger.warn(`Module not registered: ${name}`);
                return null;
            }
            
            const moduleConfig = this.modules.get(name);
            
            // Load module if not already loaded
            if (!moduleConfig.loaded) {
                this.logger.debug(`Loading module: ${name}`);
                
                const moduleExports = await moduleConfig.loader();
                const ModuleClass = moduleExports.default || moduleExports[Object.keys(moduleExports)[0]];
                
                if (!ModuleClass) {
                    throw new Error(`No default export found for module: ${name}`);
                }
                
                moduleConfig.ModuleClass = ModuleClass;
                moduleConfig.loaded = true;
            }
            
            // Create module instance
            const instance = new moduleConfig.ModuleClass(element, {
                webgl: this.options.webgl,
                audio: this.options.audio,
                themeSystem: this.options.themeSystem,
                debug: this.options.debug
            });
            
            // Store instance
            const instanceKey = element ? `${name}-${this.getElementId(element)}` : name;
            this.moduleInstances.set(instanceKey, instance);
            
            // Initialize module
            if (instance.init && typeof instance.init === 'function') {
                await instance.init();
            }
            
            this.emit('module:initialized', { name, instance, element });
            this.logger.debug(`Initialized module: ${name}`);
            
            return instance;
            
        } catch (error) {
            this.logger.error(`Failed to initialize module ${name}:`, error);
            return null;
        }
    }

    /**
     * Initialize modules for a specific page
     */
    async initForPage(page) {
        this.logger.info(`Initializing modules for page: ${page}`);
        
        try {
            // Page-specific module initialization
            switch (page) {
                case 'homepage':
                    await this.initHomepageModules();
                    break;
                case 'specs':
                    await this.initSpecsModules();
                    break;
                case 'settings':
                    await this.initSettingsModules();
                    break;
                default:
                    this.logger.debug(`No specific modules for page: ${page}`);
            }
            
            this.currentPage = page;
            this.emit('modules:page-initialized', page);
            
        } catch (error) {
            this.logger.error(`Failed to initialize modules for page ${page}:`, error);
            throw error;
        }
    }

    /**
     * Initialize homepage-specific modules
     */
    async initHomepageModules() {
        // Initialize AI assistant
        const aiElement = document.querySelector('[data-ai="w"]');
        if (aiElement) {
            await this.initModule('translink-ai', aiElement);
        }
        
        // Initialize progress indicator
        const progressElement = document.querySelector('.progress-indicator');
        if (progressElement) {
            await this.initModule('progress-indicator', progressElement);
        }
    }

    /**
     * Initialize specs page modules
     */
    async initSpecsModules() {
        // Specs-specific modules can be added here
        this.logger.debug('Initializing specs page modules');
    }

    /**
     * Initialize settings page modules
     */
    async initSettingsModules() {
        // Settings-specific modules can be added here
        this.logger.debug('Initializing settings page modules');
    }

    /**
     * Transition modules to a new page
     */
    async transitionToPage(page) {
        this.logger.info(`Transitioning modules to page: ${page}`);
        
        try {
            // Notify all modules of page transition
            for (const [key, instance] of this.moduleInstances) {
                if (instance.onPageTransition && typeof instance.onPageTransition === 'function') {
                    await instance.onPageTransition(page, this.currentPage);
                }
            }
            
            // Initialize new page modules
            await this.initForPage(page);
            
            this.emit('modules:page-transition', { from: this.currentPage, to: page });
            
        } catch (error) {
            this.logger.error(`Failed to transition modules to page ${page}:`, error);
            throw error;
        }
    }

    /**
     * Get module instance
     */
    getInstance(name, element = null) {
        const instanceKey = element ? `${name}-${this.getElementId(element)}` : name;
        return this.moduleInstances.get(instanceKey) || null;
    }

    /**
     * Get all instances of a module type
     */
    getInstances(name) {
        const instances = [];
        for (const [key, instance] of this.moduleInstances) {
            if (key.startsWith(name)) {
                instances.push(instance);
            }
        }
        return instances;
    }

    /**
     * Get unique element ID
     */
    getElementId(element) {
        if (element.id) {
            return element.id;
        }
        
        // Generate unique ID based on element position
        const elements = Array.from(document.querySelectorAll(element.tagName));
        const index = elements.indexOf(element);
        return `${element.tagName.toLowerCase()}-${index}`;
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying ModuleManager...');
        
        // Destroy all module instances
        for (const [key, instance] of this.moduleInstances) {
            if (instance.destroy && typeof instance.destroy === 'function') {
                try {
                    instance.destroy();
                } catch (error) {
                    this.logger.error(`Error destroying module instance ${key}:`, error);
                }
            }
        }
        
        this.moduleInstances.clear();
        this.modules.clear();
        
        this.removeAllListeners();
        this.isInitialized = false;
        
        this.logger.info('ModuleManager destroyed');
    }
}