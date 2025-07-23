/**
 * TRANSLINK - Renderer Manager
 * Manages Three.js renderer setup and configuration
 */

import * as THREE from 'three'
import { Logger } from '../utils/Logger.js'

/**
 * RendererManager - Handles WebGL renderer setup and management
 */
export class RendererManager {
    constructor(options = {}) {
        this.logger = new Logger('RendererManager');
        this.options = {
            canvas: null,
            debug: false,
            ...options
        };
        
        this.renderer = null;
        this.canvas = this.options.canvas;
        
        this.logger.info('RendererManager created');
    }

    /**
     * Initialize renderer
     */
    async init() {
        try {
            this.logger.info('Initializing WebGL renderer...');
            
            if (!this.canvas) {
                throw new Error('Canvas element is required');
            }
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                powerPreference: 'high-performance',
                antialias: true,
                alpha: true,
                precision: 'highp'
            });
            
            // Configure renderer
            this.configureRenderer();
            
            // Set initial size
            this.resize(window.innerWidth, window.innerHeight);
            
            this.logger.info('WebGL renderer initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize renderer:', error);
            throw error;
        }
    }

    /**
     * Configure renderer settings
     */
    configureRenderer() {
        // Basic settings
        this.renderer.autoClear = false;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Tone mapping
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Shadow settings
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Pixel ratio
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer.setPixelRatio(pixelRatio);
        
        this.logger.info('Renderer configured');
    }

    /**
     * Resize renderer
     */
    resize(width, height) {
        if (!this.renderer) {
            return;
        }
        
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(pixelRatio);
        
        this.logger.debug(`Renderer resized to ${width}x${height} (ratio: ${pixelRatio})`);
    }

    /**
     * Clear renderer
     */
    clear() {
        if (this.renderer) {
            this.renderer.clear();
        }
    }

    /**
     * Render scene with camera
     */
    render(scene, camera) {
        if (!this.renderer || !scene || !camera) {
            return;
        }
        
        this.renderer.render(scene, camera);
    }

    /**
     * Set render target
     */
    setRenderTarget(target) {
        if (this.renderer) {
            this.renderer.setRenderTarget(target);
        }
    }

    /**
     * Get renderer info
     */
    getInfo() {
        if (!this.renderer) {
            return null;
        }
        
        return {
            memory: this.renderer.info.memory,
            render: this.renderer.info.render,
            programs: this.renderer.info.programs
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying renderer...');
        
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        this.logger.info('Renderer destroyed');
    }
}