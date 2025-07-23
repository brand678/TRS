/**
 * TRANSLINK - FWA Scene
 * Special scene for FWA showcase with advanced visual effects
 */

import * as THREE from 'three'
import { BaseScene } from './BaseScene.js'
import { Logger } from '../../utils/Logger.js'

/**
 * FWAScene - Advanced showcase scene with special effects
 */
export class FWAScene extends BaseScene {
    constructor(options = {}) {
        super({
            id: 'fwa-scene',
            ...options
        });
        
        this.logger = new Logger('FWAScene');
        
        // Scene-specific settings
        this.settings = {
            camera: {
                cursorIntensity: {
                    position: 0.5,
                    rotation: 0.8
                }
            },
            effects: {
                bloomIntensity: 2.0,
                chromaticAberration: 0.002,
                vignette: 0.3
            }
        };
        
        // 3D models
        this.models = {
            fwa: null
        };
        
        // Post-processing
        this.composer = null;
        this.bloomPass = null;
        
        this.logger.info('FWAScene created');
    }

    /**
     * Set up camera for FWA scene
     */
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            33,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        
        this.camera.position.set(0, 0, 3.5);
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.scene.add(this.camera);
        
        this.logger.debug('FWA scene camera set up');
    }

    /**
     * Set up scene background and lighting
     */
    setupScene() {
        // Dynamic gradient background
        this.scene.background = new THREE.Color(0x000000);
        
        // High-contrast lighting for dramatic effect
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);
        
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
        keyLight.position.set(2, 3, 2);
        keyLight.castShadow = true;
        this.scene.add(keyLight);
        
        const rimLight = new THREE.DirectionalLight(0x60b2ff, 1.5);
        rimLight.position.set(-2, 0, -2);
        this.scene.add(rimLight);
        
        const accentLight = new THREE.PointLight(0x8affff, 1.0, 8);
        accentLight.position.set(0, 2, 3);
        this.scene.add(accentLight);
        
        this.logger.debug('FWA scene setup completed');
    }

    /**
     * Load and set up 3D models
     */
    async setupModels() {
        this.logger.info('Setting up FWA scene models...');
        
        try {
            // Get the main scene model
            const sceneAsset = this.getAsset('model', 'earbuds-scene');
            if (!sceneAsset) {
                throw new Error('Scene model not found');
            }
            
            // Create parent group
            this.modelsGroup = new THREE.Group();
            this.scene.add(this.modelsGroup);
            
            // Set up FWA model
            this.models.fwa = sceneAsset.scene.getObjectByName('fwa')?.clone();
            if (this.models.fwa) {
                this.models.fwa.rotation.set(Math.PI / 2.5, 0, 0);
                this.modelsGroup.add(this.models.fwa);
            }
            
            // Apply materials
            await this.setupMaterials();
            
            // Set up post-processing
            await this.setupPostProcessing();
            
            this.logger.info('FWA scene models set up successfully');
            
        } catch (error) {
            this.logger.error('Failed to set up FWA scene models:', error);
            throw error;
        }
    }

    /**
     * Set up materials for FWA scene
     */
    async setupMaterials() {
        this.logger.info('Setting up FWA scene materials...');
        
        try {
            // Import material system
            const { MaterialSystem } = await import('../materials/MaterialSystem.js');
            this.materialSystem = new MaterialSystem({
                assets: this.options.assets,
                themeSystem: this.options.themeSystem
            });
            
            await this.materialSystem.init();
            
            // Create enhanced materials for FWA scene
            this.materials = {
                glass: this.materialSystem.createMaterial('earphone-glass', {
                    metalness: 1,
                    roughness: 0,
                    emissive: 0xffffff,
                    emissiveIntensity: 3.0,
                    transparent: true
                })
            };
            
            // Apply materials to model
            if (this.models.fwa) {
                this.models.fwa.material = this.materials.glass;
            }
            
            // Enable all effects
            if (this.materials.glass.uniforms) {
                this.materials.glass.uniforms.uFresnelTransition.value = 1;
                this.materials.glass.uniforms.uEmissiveTransition.value = 1;
            }
            
            this.logger.info('FWA scene materials set up successfully');
            
        } catch (error) {
            this.logger.error('Failed to set up FWA scene materials:', error);
            throw error;
        }
    }

    /**
     * Set up post-processing effects
     */
    async setupPostProcessing() {
        this.logger.info('Setting up post-processing effects...');
        
        try {
            // Import post-processing modules
            const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
            const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
            const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
            const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js');
            
            // Create composer
            this.composer = new EffectComposer(this.options.renderer);
            
            // Add render pass
            const renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
            
            // Add bloom pass
            this.bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                this.settings.effects.bloomIntensity,
                0.4,
                0.85
            );
            this.composer.addPass(this.bloomPass);
            
            // Add custom effects pass
            const customEffectsPass = new ShaderPass({
                uniforms: {
                    tDiffuse: { value: null },
                    uTime: { value: 0.0 },
                    uChromaticAberration: { value: this.settings.effects.chromaticAberration },
                    uVignette: { value: this.settings.effects.vignette }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D tDiffuse;
                    uniform float uTime;
                    uniform float uChromaticAberration;
                    uniform float uVignette;
                    varying vec2 vUv;
                    
                    void main() {
                        vec2 uv = vUv;
                        
                        // Chromatic aberration
                        float aberration = uChromaticAberration * (1.0 + sin(uTime) * 0.1);
                        vec2 distortion = (uv - 0.5) * aberration;
                        
                        float r = texture2D(tDiffuse, uv + distortion).r;
                        float g = texture2D(tDiffuse, uv).g;
                        float b = texture2D(tDiffuse, uv - distortion).b;
                        
                        vec3 color = vec3(r, g, b);
                        
                        // Vignette
                        float vignette = 1.0 - length(uv - 0.5) * uVignette;
                        color *= vignette;
                        
                        gl_FragColor = vec4(color, 1.0);
                    }
                `
            });
            
            this.composer.addPass(customEffectsPass);
            this.customEffectsPass = customEffectsPass;
            
            this.logger.info('Post-processing effects set up successfully');
            
        } catch (error) {
            this.logger.warn('Post-processing not available, using standard rendering');
        }
    }

    /**
     * Initialize the FWA scene
     */
    async init() {
        await super.init();
        
        try {
            // Set up models and materials
            await this.setupModels();
            
            this.logger.info('FWAScene initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize FWAScene:', error);
            throw error;
        }
    }

    /**
     * Apply theme to FWA scene
     */
    applyTheme(theme) {
        super.applyTheme(theme);
        
        if (!theme || !theme['3d']) {
            return;
        }
        
        // Use dark background for dramatic effect
        this.scene.background = new THREE.Color(0x000000);
        
        // Update materials through material system
        if (this.materialSystem) {
            this.materialSystem.applyTheme(theme);
        }
        
        this.logger.debug('Theme applied to FWAScene');
    }

    /**
     * Render the scene with post-processing
     */
    render(renderer) {
        if (!renderer || !this.camera) {
            return;
        }
        
        // Use composer if available, otherwise standard rendering
        if (this.composer) {
            this.composer.render();
        } else {
            super.render(renderer);
        }
    }

    /**
     * Update FWA scene
     */
    update(deltaTime, elapsedTime) {
        if (!this.isActive) {
            return;
        }
        
        // Update camera look at
        if (this.camera) {
            this.camera.lookAt(this.cameraTarget);
        }
        
        // Update materials
        if (this.materialSystem) {
            this.materialSystem.update(deltaTime, elapsedTime);
        }
        
        // Update post-processing effects
        if (this.customEffectsPass) {
            this.customEffectsPass.uniforms.uTime.value = elapsedTime;
        }
        
        // Dramatic rotation animation
        if (this.modelsGroup) {
            this.modelsGroup.rotation.y += deltaTime * 0.001;
            this.modelsGroup.rotation.x = Math.sin(elapsedTime * 0.0005) * 0.1;
        }
    }

    /**
     * Handle scroll progress updates
     */
    updateScroll(progress) {
        // Dynamic effects based on scroll
        if (this.bloomPass) {
            this.bloomPass.strength = this.settings.effects.bloomIntensity * (1 + progress * 0.5);
        }
        
        this.emit('scene:scroll-update', progress);
    }

    /**
     * Resize scene and post-processing
     */
    resize(width, height) {
        super.resize(width, height);
        
        if (this.composer) {
            this.composer.setSize(width, height);
        }
        
        if (this.bloomPass) {
            this.bloomPass.setSize(width, height);
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying FWAScene...');
        
        // Dispose of post-processing
        if (this.composer) {
            this.composer.dispose();
        }
        
        // Destroy material system
        if (this.materialSystem) {
            this.materialSystem.destroy();
        }
        
        // Clear references
        this.models = {};
        this.materials = {};
        this.composer = null;
        this.bloomPass = null;
        this.customEffectsPass = null;
        
        super.destroy();
        this.logger.info('FWAScene destroyed');
    }
}

export default FWAScene;