/**
 * TRANSLINK - Easter Egg Scene
 * Special scene for preorder page with unique animations and effects
 */

import * as THREE from 'three'
import { BaseScene } from './BaseScene.js'
import { Logger } from '../../utils/Logger.js'

/**
 * EasterEggScene - Special preorder scene with unique camera angles and effects
 */
export class EasterEggScene extends BaseScene {
    constructor(options = {}) {
        super({
            id: 'easter-egg-scene',
            ...options
        });
        
        this.logger = new Logger('EasterEggScene');
        
        // Scene-specific settings
        this.settings = {
            camera: {
                position: new THREE.Vector3(0.5, 3, 10),
                target: new THREE.Vector3(1.5, 3, 0),
                fixedProgress: 0.105
            },
            animation: {
                rotationSpeed: 0.002,
                floatAmplitude: 0.1,
                floatSpeed: 0.001
            }
        };
        
        // 3D models
        this.models = {
            earbuds: null,
            case: null
        };
        
        // Animation state
        this.animationTime = 0;
        this.floatOffset = Math.random() * Math.PI * 2;
        
        this.logger.info('EasterEggScene created');
    }

    /**
     * Set up camera for easter egg scene
     */
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            33,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        
        this.camera.position.copy(this.settings.camera.position);
        this.cameraTarget = this.settings.camera.target.clone();
        this.scene.add(this.camera);
        
        this.logger.debug('Easter egg scene camera set up');
    }

    /**
     * Set up scene background and lighting
     */
    setupScene() {
        // Scene background with gradient effect
        this.scene.background = new THREE.Color(0x0a1a2e);
        
        // Dramatic lighting setup
        const ambientLight = new THREE.AmbientLight(0x4361ee, 0.3);
        this.scene.add(ambientLight);
        
        const keyLight = new THREE.DirectionalLight(0x4cc9f0, 1.2);
        keyLight.position.set(3, 4, 2);
        keyLight.castShadow = true;
        this.scene.add(keyLight);
        
        const rimLight = new THREE.DirectionalLight(0x9d4edd, 0.8);
        rimLight.position.set(-2, 1, -3);
        this.scene.add(rimLight);
        
        const fillLight = new THREE.PointLight(0xe0aaff, 0.6, 10);
        fillLight.position.set(0, -2, 4);
        this.scene.add(fillLight);
        
        this.logger.debug('Easter egg scene setup completed');
    }

    /**
     * Load and set up 3D models
     */
    async setupModels() {
        this.logger.info('Setting up easter egg scene models...');
        
        try {
            // Get the main scene model
            const sceneAsset = this.getAsset('model', 'earbuds-scene');
            if (!sceneAsset) {
                throw new Error('Scene model not found');
            }
            
            // Create parent group
            this.modelsGroup = new THREE.Group();
            this.scene.add(this.modelsGroup);
            
            // Set up earbuds model
            this.models.earbuds = sceneAsset.scene.getObjectByName('earphone-l')?.clone();
            if (this.models.earbuds) {
                this.models.earbuds.position.set(0, 0, 0);
                this.models.earbuds.rotation.set(Math.PI / 4, Math.PI / 6, 0);
                this.models.earbuds.scale.setScalar(1.2);
                this.modelsGroup.add(this.models.earbuds);
            }
            
            // Set up case model
            this.models.case = sceneAsset.scene.getObjectByName('case')?.clone();
            if (this.models.case) {
                this.models.case.position.set(2, -1, -1);
                this.models.case.rotation.set(0, Math.PI / 3, 0);
                this.models.case.scale.setScalar(0.8);
                this.modelsGroup.add(this.models.case);
            }
            
            // Apply materials
            await this.setupMaterials();
            
            this.logger.info('Easter egg scene models set up successfully');
            
        } catch (error) {
            this.logger.error('Failed to set up easter egg scene models:', error);
            throw error;
        }
    }

    /**
     * Set up materials for easter egg scene
     */
    async setupMaterials() {
        this.logger.info('Setting up easter egg scene materials...');
        
        try {
            // Import material system
            const { MaterialSystem } = await import('../materials/MaterialSystem.js');
            this.materialSystem = new MaterialSystem({
                assets: this.options.assets,
                themeSystem: this.options.themeSystem
            });
            
            await this.materialSystem.init();
            
            // Create special materials for easter egg scene
            this.materials = {
                glass: this.materialSystem.createMaterial('earphone-glass', {
                    metalness: 1,
                    roughness: 0,
                    emissive: 0x4cc9f0,
                    emissiveIntensity: 2.0,
                    transparent: true
                }),
                
                base: this.materialSystem.createMaterial('earphone-base', {
                    aoMapIntensity: 1.2,
                    emissive: 0x9d4edd,
                    emissiveIntensity: 1.5
                }),
                
                case: this.materialSystem.createMaterial('earphone-base', {
                    emissive: 0xe0aaff,
                    emissiveIntensity: 0.8
                })
            };
            
            // Apply materials to models
            if (this.models.earbuds) {
                this.models.earbuds.traverse((child) => {
                    if (child.isMesh) {
                        if (child.name.includes('glass')) {
                            child.material = this.materials.glass;
                        } else {
                            child.material = this.materials.base;
                        }
                    }
                });
            }
            
            if (this.models.case) {
                this.models.case.material = this.materials.case;
            }
            
            // Enable special effects
            if (this.materials.glass.uniforms) {
                this.materials.glass.uniforms.uFresnelTransition.value = 1;
                this.materials.glass.uniforms.uEmissiveTransition.value = 1;
            }
            
            this.logger.info('Easter egg scene materials set up successfully');
            
        } catch (error) {
            this.logger.error('Failed to set up easter egg scene materials:', error);
            throw error;
        }
    }

    /**
     * Initialize the easter egg scene
     */
    async init() {
        await super.init();
        
        try {
            // Set up models and materials
            await this.setupModels();
            
            this.logger.info('EasterEggScene initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize EasterEggScene:', error);
            throw error;
        }
    }

    /**
     * Apply theme to easter egg scene
     */
    applyTheme(theme) {
        super.applyTheme(theme);
        
        if (!theme || !theme['3d']) {
            return;
        }
        
        // Use special dark background for easter egg
        this.scene.background = new THREE.Color(0x0a1a2e);
        
        // Update materials through material system
        if (this.materialSystem) {
            this.materialSystem.applyTheme(theme);
        }
        
        this.logger.debug('Theme applied to EasterEggScene');
    }

    /**
     * Update easter egg scene
     */
    update(deltaTime, elapsedTime) {
        if (!this.isActive) {
            return;
        }
        
        this.animationTime += deltaTime;
        
        // Update camera look at
        if (this.camera) {
            this.camera.lookAt(this.cameraTarget);
        }
        
        // Update materials
        if (this.materialSystem) {
            this.materialSystem.update(deltaTime, elapsedTime);
        }
        
        // Floating animation for earbuds
        if (this.models.earbuds) {
            this.models.earbuds.position.y = Math.sin(this.animationTime * this.settings.animation.floatSpeed + this.floatOffset) * this.settings.animation.floatAmplitude;
            this.models.earbuds.rotation.y += this.settings.animation.rotationSpeed;
        }
        
        // Gentle rotation for case
        if (this.models.case) {
            this.models.case.rotation.y += this.settings.animation.rotationSpeed * 0.5;
        }
        
        // Rotate entire group slowly
        if (this.modelsGroup) {
            this.modelsGroup.rotation.y += this.settings.animation.rotationSpeed * 0.3;
        }
    }

    /**
     * Handle scroll progress updates
     */
    updateScroll(progress) {
        // Fixed progress for easter egg scene
        const fixedProgress = this.settings.camera.fixedProgress;
        
        // Apply subtle camera movement based on fixed progress
        if (this.camera) {
            const offset = Math.sin(fixedProgress * Math.PI * 2) * 0.1;
            this.camera.position.x = this.settings.camera.position.x + offset;
        }
        
        this.emit('scene:scroll-update', fixedProgress);
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying EasterEggScene...');
        
        // Destroy material system
        if (this.materialSystem) {
            this.materialSystem.destroy();
        }
        
        // Clear references
        this.models = {};
        this.materials = {};
        
        super.destroy();
        this.logger.info('EasterEggScene destroyed');
    }
}

export default EasterEggScene;