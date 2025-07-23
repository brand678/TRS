/**
 * TRANSLINK - Base Scene
 * Abstract base class for all 3D scenes
 */

import * as THREE from 'three'
import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * BaseScene - Abstract base class for all scenes
 */
export class BaseScene extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger(`Scene:${options.id || 'Unknown'}`);
        this.options = {
            id: 'base-scene',
            renderer: null,
            assets: null,
            debug: false,
            themeSystem: null,
            ...options
        };
        
        // Core Three.js components
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderTarget = null;
        
        // State
        this.isInitialized = false;
        this.isActive = false;
        
        this.logger.info(`BaseScene created: ${this.options.id}`);
    }

    /**
     * Initialize the scene (to be implemented by subclasses)
     */
    async init() {
        this.logger.info('Initializing base scene...');
        
        try {
            // Set up render target
            this.setupRenderTarget();
            
            // Set up camera
            this.setupCamera();
            
            // Set up scene
            this.setupScene();
            
            this.isInitialized = true;
            this.emit('scene:initialized');
            
            this.logger.info('Base scene initialized');
            
        } catch (error) {
            this.logger.error('Failed to initialize base scene:', error);
            throw error;
        }
    }

    /**
     * Set up render target
     */
    setupRenderTarget() {
        if (!this.options.renderer) {
            this.logger.warn('No renderer provided, skipping render target setup');
            return;
        }
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        
        this.renderTarget = new THREE.WebGLRenderTarget(
            width * pixelRatio,
            height * pixelRatio,
            {
                samples: 4,
                type: THREE.HalfFloatType
            }
        );
        
        this.logger.debug('Render target created');
    }

    /**
     * Set up camera (to be implemented by subclasses)
     */
    setupCamera() {
        // Default perspective camera
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        this.camera.position.set(0, 0, 5);
        this.scene.add(this.camera);
        
        this.logger.debug('Default camera created');
    }

    /**
     * Set up scene (to be implemented by subclasses)
     */
    setupScene() {
        // Default scene setup
        this.scene.background = new THREE.Color(0x000000);
        
        // Add basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        this.logger.debug('Default scene setup completed');
    }

    /**
     * Transition in animation
     */
    async transitionIn() {
        this.logger.debug('Scene transitioning in');
        this.isActive = true;
        this.emit('scene:transition-in');
    }

    /**
     * Transition out animation
     */
    async transitionOut() {
        this.logger.debug('Scene transitioning out');
        this.isActive = false;
        this.emit('scene:transition-out');
    }

    /**
     * Update scene (to be implemented by subclasses)
     */
    update(deltaTime, elapsedTime) {
        // Override in subclasses
    }

    /**
     * Background update for inactive scenes
     */
    backgroundUpdate(deltaTime, elapsedTime) {
        // Override in subclasses if needed
    }

    /**
     * Render the scene
     */
    render(renderer) {
        if (!renderer || !this.camera) {
            return;
        }
        
        // Render to target if available, otherwise to screen
        if (this.renderTarget) {
            renderer.setRenderTarget(this.renderTarget);
            renderer.render(this.scene, this.camera);
            renderer.setRenderTarget(null);
        } else {
            renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Resize scene
     */
    resize(width, height) {
        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        
        if (this.renderTarget) {
            const pixelRatio = Math.min(window.devicePixelRatio, 2);
            this.renderTarget.setSize(width * pixelRatio, height * pixelRatio);
        }
        
        this.logger.debug(`Scene resized to ${width}x${height}`);
    }

    /**
     * Get scene assets
     */
    getAsset(type, name) {
        if (!this.options.assets) {
            this.logger.warn('No assets manager available');
            return null;
        }
        
        return this.options.assets.get(type, name);
    }

    /**
     * Apply theme colors (to be implemented by subclasses)
     */
    applyTheme(theme) {
        if (!theme) {
            return;
        }
        
        // Update scene background if theme has 3D colors
        if (theme['3d'] && theme['3d'].sceneBackground) {
            this.scene.background = new THREE.Color(theme['3d'].sceneBackground);
        }
        
        this.logger.debug('Base theme applied');
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying scene...');
        
        // Dispose of render target
        if (this.renderTarget) {
            this.renderTarget.dispose();
        }
        
        // Dispose of scene objects
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        // Clear scene
        this.scene.clear();
        
        // Remove event listeners
        this.removeAllListeners();
        
        this.isInitialized = false;
        this.isActive = false;
        
        this.logger.info('Scene destroyed');
    }
}