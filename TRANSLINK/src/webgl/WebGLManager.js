/**
 * TRANSLINK - WebGL Manager
 * Central management of WebGL/Three.js systems
 */

import * as THREE from 'three'
import { EventEmitter } from '../utils/EventEmitter.js'
import { Logger } from '../utils/Logger.js'
import { AssetManager } from './AssetManager.js'
import { SceneManager } from './scenes/SceneManager.js'
import { RendererManager } from './RendererManager.js'

/**
 * WebGLManager - Central coordination of all WebGL systems
 */
export class WebGLManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('WebGLManager');
        this.options = {
            canvas: '[data-webgl-canvas]',
            debug: false,
            themeSystem: null,
            ...options
        };
        
        // Core Three.js components
        this.canvas = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // System managers
        this.assets = null;
        this.scenes = null;
        this.rendererManager = null;
        
        // State
        this.isInitialized = false;
        this.isRunning = false;
        this.currentScene = null;
        
        // Performance monitoring
        this.stats = null;
        
        this.logger.info('WebGLManager created');
    }

    /**
     * Initialize WebGL system
     */
    async init() {
        try {
            this.logger.info('Initializing WebGL system...');
            
            // Get canvas element
            this.canvas = document.querySelector(this.options.canvas);
            if (!this.canvas) {
                throw new Error(`Canvas not found: ${this.options.canvas}`);
            }
            
            // Initialize renderer
            await this.initRenderer();
            
            // Initialize asset manager
            await this.initAssets();
            
            // Initialize scene manager
            await this.initScenes();
            
            // Set up resize handling
            this.setupResize();
            
            // Set up debug tools
            if (this.options.debug) {
                this.setupDebug();
            }
            
            this.isInitialized = true;
            this.emit('webgl:initialized');
            
            this.logger.info('WebGL system initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize WebGL system:', error);
            throw error;
        }
    }

    /**
     * Initialize renderer
     */
    async initRenderer() {
        this.logger.info('Initializing renderer...');
        
        try {
            this.rendererManager = new RendererManager({
                canvas: this.canvas,
                debug: this.options.debug
            });
            
            await this.rendererManager.init();
            this.renderer = this.rendererManager.renderer;
            
            this.emit('renderer:initialized', this.renderer);
            
        } catch (error) {
            this.logger.error('Failed to initialize renderer:', error);
            throw error;
        }
    }

    /**
     * Initialize asset manager
     */
    async initAssets() {
        this.logger.info('Initializing assets...');
        
        try {
            this.assets = new AssetManager({
                debug: this.options.debug
            });
            
            await this.assets.init();
            
            this.emit('assets:initialized', this.assets);
            
        } catch (error) {
            this.logger.error('Failed to initialize assets:', error);
            throw error;
        }
    }

    /**
     * Initialize scene manager
     */
    async initScenes() {
        this.logger.info('Initializing scenes...');
        
        try {
            this.scenes = new SceneManager({
                renderer: this.renderer,
                assets: this.assets,
                debug: this.options.debug,
                themeSystem: this.options.themeSystem
            });
            
            await this.scenes.init();
            
            this.emit('scenes:initialized', this.scenes);
            
        } catch (error) {
            this.logger.error('Failed to initialize scenes:', error);
            throw error;
        }
    }

    /**
     * Initialize scene for a specific page
     */
    async initScene(page) {
        this.logger.info(`Initializing scene for page: ${page}`);
        
        try {
            if (!this.scenes) {
                throw new Error('Scene manager not initialized');
            }
            
            const scene = await this.scenes.getScene(page);
            this.currentScene = scene;
            
            // Start render loop if not already running
            if (!this.isRunning) {
                this.startRenderLoop();
            }
            
            this.emit('scene:initialized', { page, scene });
            
        } catch (error) {
            this.logger.error(`Failed to initialize scene for page ${page}:`, error);
            throw error;
        }
    }

    /**
     * Transition to a new scene
     */
    async transitionToScene(page) {
        this.logger.info(`Transitioning to scene: ${page}`);
        
        try {
            if (!this.scenes) {
                throw new Error('Scene manager not initialized');
            }
            
            const newScene = await this.scenes.transitionTo(page);
            this.currentScene = newScene;
            
            this.emit('scene:transition', { page, scene: newScene });
            
        } catch (error) {
            this.logger.error(`Failed to transition to scene ${page}:`, error);
            throw error;
        }
    }

    /**
     * Start render loop
     */
    startRenderLoop() {
        if (this.isRunning) {
            return;
        }
        
        this.logger.info('Starting render loop...');
        this.isRunning = true;
        
        const animate = () => {
            if (!this.isRunning) {
                return;
            }
            
            requestAnimationFrame(animate);
            
            const deltaTime = this.clock.getDelta();
            const elapsedTime = this.clock.getElapsedTime();
            
            this.update(deltaTime, elapsedTime);
            this.render();
        };
        
        animate();
        this.emit('render-loop:started');
    }

    /**
     * Stop render loop
     */
    stopRenderLoop() {
        this.logger.info('Stopping render loop...');
        this.isRunning = false;
        this.emit('render-loop:stopped');
    }

    /**
     * Update systems
     */
    update(deltaTime, elapsedTime) {
        // Update current scene
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(deltaTime, elapsedTime);
        }
        
        // Update scene manager
        if (this.scenes) {
            this.scenes.update(deltaTime, elapsedTime);
        }
        
        // Update stats
        if (this.stats) {
            this.stats.update();
        }
        
        this.emit('webgl:update', { deltaTime, elapsedTime });
    }

    /**
     * Render frame
     */
    render() {
        if (!this.renderer || !this.currentScene) {
            return;
        }
        
        // Render current scene
        if (this.currentScene.render) {
            this.currentScene.render(this.renderer);
        } else if (this.scenes) {
            this.scenes.render(this.renderer);
        }
        
        this.emit('webgl:render');
    }

    /**
     * Set up resize handling
     */
    setupResize() {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // Update renderer
            if (this.rendererManager) {
                this.rendererManager.resize(width, height);
            }
            
            // Update scenes
            if (this.scenes) {
                this.scenes.resize(width, height);
            }
            
            this.emit('webgl:resize', { width, height });
        };
        
        window.addEventListener('resize', handleResize);
        
        // Initial resize
        handleResize();
    }

    /**
     * Set up debug tools
     */
    setupDebug() {
        this.logger.info('Setting up debug tools...');
        
        try {
            // Import stats dynamically
            import('stats-gl').then(({ default: Stats }) => {
                this.stats = new Stats({
                    trackGPU: true
                });
                
                if (this.renderer) {
                    this.stats.init(this.renderer);
                }
                
                document.body.appendChild(this.stats.dom);
                this.logger.info('Stats panel added');
            }).catch(error => {
                this.logger.warn('Failed to load stats panel:', error);
            });
            
        } catch (error) {
            this.logger.warn('Failed to set up debug tools:', error);
        }
    }

    /**
     * Get current scene
     */
    getCurrentScene() {
        return this.currentScene;
    }

    /**
     * Get system by name
     */
    getSystem(name) {
        switch (name) {
            case 'assets':
                return this.assets;
            case 'scenes':
                return this.scenes;
            case 'renderer':
                return this.rendererManager;
            default:
                this.logger.warn(`Unknown WebGL system: ${name}`);
                return null;
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying WebGL system...');
        
        // Stop render loop
        this.stopRenderLoop();
        
        // Destroy systems
        if (this.scenes) {
            this.scenes.destroy();
        }
        
        if (this.assets) {
            this.assets.destroy();
        }
        
        if (this.rendererManager) {
            this.rendererManager.destroy();
        }
        
        // Remove stats
        if (this.stats && this.stats.dom) {
            document.body.removeChild(this.stats.dom);
        }
        
        // Remove event listeners
        this.removeAllListeners();
        
        this.isInitialized = false;
        this.logger.info('WebGL system destroyed');
    }
}