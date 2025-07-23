/**
 * TRANSLINK - Specs Scene
 * Product specifications display scene with single earphone focus
 */

import * as THREE from 'three'
import { BaseScene } from './BaseScene.js'
import { Logger } from '../../utils/Logger.js'

/**
 * SpecsScene - Single earphone focus view with rotation animations
 */
export class SpecsScene extends BaseScene {
    constructor(options = {}) {
        super({
            id: 'specs-scene',
            ...options
        });
        
        this.logger = new Logger('SpecsScene');
        
        // Scene-specific settings
        this.settings = {
            camera: {
                cursorIntensity: {
                    position: 1,
                    rotation: 1
                }
            },
            rotation: {
                speed: 0.5,
                autoRotate: true
            }
        };
        
        // 3D models
        this.models = {
            earphone: null,
            idle: null
        };
        
        // Animation
        this.rotationTimeline = null;
        this.emissiveTimeline = null;
        
        this.logger.info('SpecsScene created');
    }

    /**
     * Set up camera for specs scene
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
        
        this.logger.debug('Specs scene camera set up');
    }

    /**
     * Set up scene background and lighting
     */
    setupScene() {
        // Scene background
        this.scene.background = new THREE.Color(0x133153);
        
        // Enhanced lighting for product showcase
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
        keyLight.position.set(2, 2, 2);
        keyLight.castShadow = true;
        this.scene.add(keyLight);
        
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-1, 0, 1);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0x60b2ff, 0.6);
        rimLight.position.set(0, 0, -2);
        this.scene.add(rimLight);
        
        this.logger.debug('Specs scene setup completed');
    }

    /**
     * Load and set up 3D models
     */
    async setupModels() {
        this.logger.info('Setting up specs scene models...');
        
        try {
            // Get the main scene model
            const sceneAsset = this.getAsset('model', 'earbuds-scene');
            if (!sceneAsset) {
                throw new Error('Scene model not found');
            }
            
            // Create parent group
            this.modelsGroup = new THREE.Group();
            this.scene.add(this.modelsGroup);
            
            // Set up idle earphone model
            this.models.idle = sceneAsset.scene.getObjectByName('earphone-l-idle')?.clone();
            if (this.models.idle) {
                this.models.idle.position.set(-0.25, 0, 0);
                this.models.idle.rotation.set(Math.PI / 2, 0, 0);
                this.modelsGroup.add(this.models.idle);
                
                // Get individual components
                this.models.earphone = this.models.idle.getObjectByName('earphone-l');
                this.models.glass = this.models.idle.getObjectByName('earphone-l-glass');
                this.models.base = this.models.idle.getObjectByName('earphone-l-base');
                this.models.silicone = this.models.idle.getObjectByName('earphone-l-silicone');
                this.models.core = this.models.idle.getObjectByName('earphone-l-core');
                this.models.speaker = this.models.idle.getObjectByName('earphone-l-speaker');
                this.models.rectangle = this.models.idle.getObjectByName('earphone-l-rectangle');
                
                // Hide raycast helpers
                const raycast = this.models.idle.getObjectByName('earphone-l-raycast');
                if (raycast) {
                    raycast.visible = false;
                }
            }
            
            // Apply materials
            await this.setupMaterials();
            
            // Set up animations
            this.setupAnimations();
            
            this.logger.info('Specs scene models set up successfully');
            
        } catch (error) {
            this.logger.error('Failed to set up specs scene models:', error);
            throw error;
        }
    }

    /**
     * Set up materials for specs scene
     */
    async setupMaterials() {
        this.logger.info('Setting up specs scene materials...');
        
        try {
            // Import material system
            const { MaterialSystem } = await import('../materials/MaterialSystem.js');
            this.materialSystem = new MaterialSystem({
                assets: this.options.assets,
                themeSystem: this.options.themeSystem
            });
            
            await this.materialSystem.init();
            
            // Create materials with enhanced settings for specs view
            this.materials = {
                glass: this.materialSystem.createMaterial('earphone-glass', {
                    metalness: 1,
                    roughness: 0,
                    emissive: 0xffffff,
                    emissiveIntensity: 1.25,
                    transparent: true
                }),
                
                base: this.materialSystem.createMaterial('earphone-base', {
                    aoMapIntensity: 1.1,
                    emissive: 0xffffff,
                    emissiveIntensity: 1
                }),
                
                core: this.materialSystem.createMaterial('core'),
                
                silicone: this.materialSystem.createMaterial('silicone')
            };
            
            // Apply materials to model components
            if (this.models.glass) this.models.glass.material = this.materials.glass;
            if (this.models.base) this.models.base.material = this.materials.base;
            if (this.models.silicone) this.models.silicone.material = this.materials.base;
            if (this.models.core) this.models.core.material = this.materials.core;
            if (this.models.speaker) this.models.speaker.material = this.materials.base;
            if (this.models.rectangle) this.models.rectangle.material = this.materials.base;
            
            // Enable fresnel transition
            if (this.materials.glass.uniforms) {
                this.materials.glass.uniforms.uFresnelTransition.value = 1;
            }
            if (this.materials.base.uniforms) {
                this.materials.base.uniforms.uFresnelTransition.value = 1;
            }
            
            this.logger.info('Specs scene materials set up successfully');
            
        } catch (error) {
            this.logger.error('Failed to set up specs scene materials:', error);
            throw error;
        }
    }

    /**
     * Set up rotation and emissive animations
     */
    setupAnimations() {
        this.logger.info('Setting up specs scene animations...');
        
        try {
            // Import animation system
            import('../../utils/AnimationSystem.js').then(({ AnimationSystem }) => {
                this.animationSystem = new AnimationSystem();
                
                // Create rotation timeline
                this.rotationTimeline = this.animationSystem.createTimeline({
                    paused: true,
                    repeat: -1
                });
                
                if (this.modelsGroup) {
                    this.rotationTimeline.to(this.modelsGroup.rotation, {
                        y: Math.PI * 2,
                        duration: 10,
                        ease: 'none'
                    });
                }
                
                // Create emissive timeline
                this.emissiveTimeline = this.animationSystem.createTimeline({
                    paused: true
                });
                
                if (this.materials.glass && this.materials.glass.uniforms) {
                    this.emissiveTimeline
                        .to(this.materials.glass.uniforms.uEmissiveTransition, {
                            value: 1,
                            duration: 0.5,
                            delay: 2.5
                        })
                        .to(this.materials.glass.uniforms.uEmissiveTransition, {
                            value: 1,
                            duration: 1
                        });
                }
                
                this.logger.info('Specs scene animations set up successfully');
            }).catch(error => {
                this.logger.warn('Animation system not available, using basic animations');
                this.setupBasicAnimations();
            });
            
        } catch (error) {
            this.logger.error('Failed to set up animations:', error);
            this.setupBasicAnimations();
        }
    }

    /**
     * Set up basic animations without animation system
     */
    setupBasicAnimations() {
        this.basicRotation = {
            enabled: true,
            speed: 0.005
        };
        
        this.logger.debug('Basic animations set up');
    }

    /**
     * Initialize the specs scene
     */
    async init() {
        await super.init();
        
        try {
            // Set up models and materials
            await this.setupModels();
            
            this.logger.info('SpecsScene initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize SpecsScene:', error);
            throw error;
        }
    }

    /**
     * Apply theme to specs scene
     */
    applyTheme(theme) {
        super.applyTheme(theme);
        
        if (!theme || !theme['3d']) {
            return;
        }
        
        // Update scene background
        this.scene.background = new THREE.Color(theme['3d'].sceneBackground);
        
        // Update materials through material system
        if (this.materialSystem) {
            this.materialSystem.applyTheme(theme);
        }
        
        this.logger.debug('Theme applied to SpecsScene');
    }

    /**
     * Update specs scene
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
        
        // Basic rotation if animation system not available
        if (this.basicRotation && this.basicRotation.enabled && this.modelsGroup) {
            this.modelsGroup.rotation.y += this.basicRotation.speed;
        }
        
        // Update animation system
        if (this.animationSystem) {
            this.animationSystem.update(deltaTime);
        }
    }

    /**
     * Handle scroll progress updates
     */
    updateScroll(progress) {
        // Update rotation based on scroll
        if (this.rotationTimeline) {
            this.rotationTimeline.progress(progress);
        }
        
        // Update emissive based on scroll
        if (this.emissiveTimeline) {
            this.emissiveTimeline.progress(progress);
        }
        
        this.emit('scene:scroll-update', progress);
    }

    /**
     * Start auto rotation
     */
    startAutoRotation() {
        if (this.rotationTimeline) {
            this.rotationTimeline.play();
        } else if (this.basicRotation) {
            this.basicRotation.enabled = true;
        }
        
        this.logger.debug('Auto rotation started');
    }

    /**
     * Stop auto rotation
     */
    stopAutoRotation() {
        if (this.rotationTimeline) {
            this.rotationTimeline.pause();
        } else if (this.basicRotation) {
            this.basicRotation.enabled = false;
        }
        
        this.logger.debug('Auto rotation stopped');
    }

    /**
     * Transition in animation
     */
    async transitionIn() {
        await super.transitionIn();
        
        // Start auto rotation
        this.startAutoRotation();
        
        this.logger.debug('SpecsScene transitioned in');
    }

    /**
     * Transition out animation
     */
    async transitionOut() {
        await super.transitionOut();
        
        // Stop auto rotation
        this.stopAutoRotation();
        
        this.logger.debug('SpecsScene transitioned out');
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying SpecsScene...');
        
        // Stop animations
        if (this.rotationTimeline) {
            this.rotationTimeline.kill();
        }
        if (this.emissiveTimeline) {
            this.emissiveTimeline.kill();
        }
        
        // Destroy animation system
        if (this.animationSystem) {
            this.animationSystem.destroy();
        }
        
        // Destroy material system
        if (this.materialSystem) {
            this.materialSystem.destroy();
        }
        
        // Clear references
        this.models = {};
        this.materials = {};
        
        super.destroy();
        this.logger.info('SpecsScene destroyed');
    }
}

export default SpecsScene;