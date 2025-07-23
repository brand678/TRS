/**
 * TRANSLINK - Scene Manager
 * Manages multiple 3D scenes and transitions between them
 */

import * as THREE from 'three'
import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * SceneManager - Handles scene creation, management, and transitions
 */
export class SceneManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('SceneManager');
        this.options = {
            renderer: null,
            assets: null,
            debug: false,
            themeSystem: null,
            ...options
        };
        
        // Scene registry
        this.scenes = new Map();
        this.sceneClasses = new Map();
        
        // State
        this.currentScene = null;
        this.isTransitioning = false;
        
        this.logger.info('SceneManager created');
    }

    /**
     * Initialize scene manager
     */
    async init() {
        try {
            this.logger.info('Initializing SceneManager...');
            
            // Register scene classes
            this.registerSceneClasses();
            
            this.emit('scenes:initialized');
            this.logger.info('SceneManager initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize SceneManager:', error);
            throw error;
        }
    }

    /**
     * Register available scene classes
     */
    registerSceneClasses() {
        // Register scene types with their corresponding classes
        this.sceneClasses.set('homepage', () => import('./MainScene.js'));
        this.sceneClasses.set('specs', () => import('./SpecsScene.js'));
        this.sceneClasses.set('preorder', () => import('./EasterEggScene.js'));
        this.sceneClasses.set('fwa', () => import('./FWAScene.js'));
        this.sceneClasses.set('settings', () => import('./SettingsScene.js'));
        
        this.logger.info(`Registered ${this.sceneClasses.size} scene types`);
    }

    /**
     * Get or create a scene for a specific page
     */
    async getScene(page) {
        this.logger.info(`Getting scene for page: ${page}`);
        
        try {
            // Check if scene already exists
            if (this.scenes.has(page)) {
                return this.scenes.get(page);
            }
            
            // Create new scene
            const scene = await this.createScene(page);
            this.scenes.set(page, scene);
            
            this.emit('scene:created', { page, scene });
            return scene;
            
        } catch (error) {
            this.logger.error(`Failed to get scene for page ${page}:`, error);
            throw error;
        }
    }

    /**
     * Create a new scene instance
     */
    async createScene(page) {
        this.logger.info(`Creating scene for page: ${page}`);
        
        try {
            const sceneLoader = this.sceneClasses.get(page);
            if (!sceneLoader) {
                throw new Error(`No scene class registered for page: ${page}`);
            }
            
            // Dynamically import scene class
            const sceneModule = await sceneLoader();
            const SceneClass = sceneModule.default || sceneModule[Object.keys(sceneModule)[0]];
            
            if (!SceneClass) {
                throw new Error(`No scene class found in module for page: ${page}`);
            }
            
            // Create scene instance
            const scene = new SceneClass({
                id: page,
                renderer: this.options.renderer,
                assets: this.options.assets,
                debug: this.options.debug,
                themeSystem: this.options.themeSystem
            });
            
            // Initialize scene
            if (scene.init && typeof scene.init === 'function') {
                await scene.init();
            }
            
            this.logger.info(`Scene created for page: ${page}`);
            return scene;
            
        } catch (error) {
            this.logger.error(`Failed to create scene for page ${page}:`, error);
            throw error;
        }
    }

    /**
     * Transition to a new scene
     */
    async transitionTo(page) {
        if (this.isTransitioning) {
            this.logger.warn('Scene transition already in progress');
            return this.currentScene;
        }
        
        this.logger.info(`Transitioning to scene: ${page}`);
        
        try {
            this.isTransitioning = true;
            
            // Get target scene
            const targetScene = await this.getScene(page);
            
            // Perform transition
            await this.performTransition(this.currentScene, targetScene);
            
            // Update current scene
            this.currentScene = targetScene;
            
            this.emit('scene:transition-complete', { page, scene: targetScene });
            this.logger.info(`Scene transition completed: ${page}`);
            
            return targetScene;
            
        } catch (error) {
            this.logger.error(`Failed to transition to scene ${page}:`, error);
            throw error;
        } finally {
            this.isTransitioning = false;
        }
    }

    /**
     * Perform scene transition animation
     */
    async performTransition(fromScene, toScene) {
        this.logger.debug('Performing scene transition');
        
        try {
            // Transition out current scene
            if (fromScene && fromScene.transitionOut) {
                await fromScene.transitionOut();
            }
            
            // Transition in new scene
            if (toScene && toScene.transitionIn) {
                await toScene.transitionIn();
            }
            
            this.emit('scene:transition-performed', { fromScene, toScene });
            
        } catch (error) {
            this.logger.error('Error during scene transition:', error);
            throw error;
        }
    }

    /**
     * Update all scenes
     */
    update(deltaTime, elapsedTime) {
        // Update current scene
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(deltaTime, elapsedTime);
        }
        
        // Update other scenes if needed (for background processing)
        for (const [page, scene] of this.scenes) {
            if (scene !== this.currentScene && scene.backgroundUpdate) {
                scene.backgroundUpdate(deltaTime, elapsedTime);
            }
        }
    }

    /**
     * Render current scene
     */
    render(renderer) {
        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(renderer);
        }
    }

    /**
     * Resize all scenes
     */
    resize(width, height) {
        for (const [page, scene] of this.scenes) {
            if (scene.resize && typeof scene.resize === 'function') {
                scene.resize(width, height);
            }
        }
    }

    /**
     * Get all scenes
     */
    getAllScenes() {
        return Array.from(this.scenes.values());
    }

    /**
     * Get current scene
     */
    getCurrentScene() {
        return this.currentScene;
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying SceneManager...');
        
        // Destroy all scenes
        for (const [page, scene] of this.scenes) {
            if (scene.destroy && typeof scene.destroy === 'function') {
                try {
                    scene.destroy();
                } catch (error) {
                    this.logger.error(`Error destroying scene ${page}:`, error);
                }
            }
        }
        
        this.scenes.clear();
        this.sceneClasses.clear();
        
        this.removeAllListeners();
        this.currentScene = null;
        
        this.logger.info('SceneManager destroyed');
    }
}