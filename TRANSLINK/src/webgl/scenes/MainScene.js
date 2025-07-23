/**
 * TRANSLINK - Main Scene
 * Primary 3D earbuds showcase scene
 */

import * as THREE from 'three'
import { BaseScene } from './BaseScene.js'
import { Logger } from '../../utils/Logger.js'

/**
 * MainScene - Primary product display and interactions
 */
export class MainScene extends BaseScene {
    constructor(options = {}) {
        super({
            id: 'main-scene',
            ...options
        });
        
        this.logger = new Logger('MainScene');
        
        // Scene-specific settings
        this.settings = {
            camera: {
                cursorIntensity: {
                    position: 1,
                    rotation: 1
                }
            },
            idle: {
                cursorIntensity: { idle: 1 }
            }
        };
        
        // 3D models
        this.models = {
            case: null,
            earphones: null,
            tube: null
        };
        
        // Materials
        this.materials = {
            glass: null,
            base: null,
            core: null,
            tube: null,
            touchpad: null
        };
        
        // Mouse interaction
        this.mouseEased = {
            camera: { x: 0, y: 0 },
            fresnel: { x: 0, y: 0 }
        };
        
        this.logger.info('MainScene created');
    }

    /**
     * Set up camera for main scene
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
        
        this.logger.debug('Main scene camera set up');
    }

    /**
     * Set up scene background and lighting
     */
    setupScene() {
        // Scene background
        this.scene.background = new THREE.Color(0x133153);
        
        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        this.logger.debug('Main scene setup completed');
    }

    /**
     * Load and set up 3D models
     */
    async setupModels() {
        this.logger.info('Setting up 3D models...');
        
        try {
            // Get the main scene model
            const sceneAsset = this.getAsset('model', 'earbuds-scene');
            if (!sceneAsset) {
                throw new Error('Main scene model not found');
            }
            
            // Create parent group
            this.modelsGroup = new THREE.Group();
            this.scene.add(this.modelsGroup);
            
            // Clone and set up case model
            this.models.case = sceneAsset.scene.getObjectByName('case')?.clone();
            if (this.models.case) {
                this.modelsGroup.add(this.models.case);
            }
            
            // Clone and set up earphone models
            const earphoneL = sceneAsset.scene.getObjectByName('earphone-l')?.clone();
            const earphoneR = sceneAsset.scene.getObjectByName('earphone-r')?.clone();
            
            if (earphoneL && earphoneR) {
                this.models.earphones = new THREE.Group();
                this.models.earphones.add(earphoneL);
                this.models.earphones.add(earphoneR);
                this.modelsGroup.add(this.models.earphones);
            }
            
            // Set up tube model
            this.models.tube = sceneAsset.scene.getObjectByName('tube')?.clone();
            if (this.models.tube) {
                this.models.tube.rotation.x = Math.PI * (0.5 - 0.425);
                this.modelsGroup.add(this.models.tube);
            }
            
            // Apply materials
            await this.setupMaterials();
            
            this.logger.info('3D models set up successfully');
            
        } catch (error) {
            this.logger.error('Failed to set up 3D models:', error);
            throw error;
        }
    }

    /**
     * Set up materials for 3D models
     */
    async setupMaterials() {
        this.logger.info('Setting up materials...');
        
        try {
            // Import material system
            const { MaterialSystem } = await import('../materials/MaterialSystem.js');
            this.materialSystem = new MaterialSystem({
                assets: this.options.assets,
                themeSystem: this.options.themeSystem
            });
            
            await this.materialSystem.init();
            
            // Create materials
            this.materials.glass = this.materialSystem.createMaterial('earphone-glass', {
                metalness: 1,
                roughness: 0,
                emissive: 0xffffff,
                emissiveIntensity: 1.25
            });
            
            this.materials.base = this.materialSystem.createMaterial('earphone-base', {
                aoMapIntensity: 1.1,
                emissive: 0xffffff,
                emissiveIntensity: 1
            });
            
            this.materials.core = this.materialSystem.createMaterial('core');
            this.materials.tube = this.materialSystem.createMaterial('tube');
            this.materials.touchpad = this.materialSystem.createMaterial('touchpad');
            
            // Apply materials to models
            this.applyMaterialsToModels();
            
            this.logger.info('Materials set up successfully');
            
        } catch (error) {
            this.logger.error('Failed to set up materials:', error);
            throw error;
        }
    }

    /**
     * Apply materials to 3D models
     */
    applyMaterialsToModels() {
        if (this.models.earphones) {
            this.models.earphones.traverse((child) => {
                if (child.isMesh) {
                    switch (child.name) {
                        case 'earphone-l-glass':
                        case 'earphone-r-glass':
                            child.material = this.materials.glass;
                            break;
                        case 'earphone-l-base':
                        case 'earphone-r-base':
                        case 'earphone-l-silicone':
                        case 'earphone-r-silicone':
                            child.material = this.materials.base;
                            break;
                        case 'earphone-l-core':
                        case 'earphone-r-core':
                            child.material = this.materials.core;
                            break;
                    }
                }
            });
        }
        
        if (this.models.tube) {
            this.models.tube.material = this.materials.tube;
        }
        
        this.logger.debug('Materials applied to models');
    }

    /**
     * Set up mouse interactions
     */
    setupMouseInteractions() {
        // Mouse movement tracking
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Touch interactions for mobile
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        
        this.logger.debug('Mouse interactions set up');
    }

    /**
     * Handle mouse movement
     */
    handleMouseMove(event) {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.updateMousePosition(x, y);
    }

    /**
     * Handle touch movement
     */
    handleTouchMove(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const x = (touch.clientX / window.innerWidth) * 2 - 1;
            const y = -(touch.clientY / window.innerHeight) * 2 + 1;
            
            this.updateMousePosition(x, y);
        }
    }

    /**
     * Update mouse position with easing
     */
    updateMousePosition(x, y) {
        // Smooth easing for camera movement
        this.mouseEased.camera.x += (x - this.mouseEased.camera.x) * 0.01;
        this.mouseEased.camera.y += (y - this.mouseEased.camera.y) * 0.01;
        
        // Smooth easing for fresnel effects
        this.mouseEased.fresnel.x += (x - this.mouseEased.fresnel.x) * 0.05;
        this.mouseEased.fresnel.y += (y - this.mouseEased.fresnel.y) * 0.05;
    }

    /**
     * Initialize the main scene
     */
    async init() {
        await super.init();
        
        try {
            // Set up models and materials
            await this.setupModels();
            
            // Set up interactions
            this.setupMouseInteractions();
            
            this.logger.info('MainScene initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize MainScene:', error);
            throw error;
        }
    }

    /**
     * Apply theme to scene
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
        
        this.logger.debug('Theme applied to MainScene');
    }

    /**
     * Update scene
     */
    update(deltaTime, elapsedTime) {
        if (!this.isActive) {
            return;
        }
        
        // Update camera based on mouse movement
        if (this.camera && window.innerWidth > 768) {
            this.camera.position.x = -this.mouseEased.camera.x * this.settings.camera.cursorIntensity.rotation;
            this.camera.position.y = this.mouseEased.camera.y * this.settings.camera.cursorIntensity.rotation;
            
            this.camera.rotation.x -= this.mouseEased.camera.y * 0.05 * this.settings.camera.cursorIntensity.position;
            this.camera.rotation.y += this.mouseEased.camera.x * 0.025 * this.settings.camera.cursorIntensity.position;
            this.camera.rotation.z = -this.mouseEased.camera.y * this.mouseEased.camera.x * 0.1 * this.settings.camera.cursorIntensity.position;
            
            this.camera.lookAt(this.cameraTarget);
        }
        
        // Update materials
        if (this.materialSystem) {
            this.materialSystem.update(deltaTime, elapsedTime);
        }
        
        // Update models
        if (this.models.tube) {
            this.models.tube.rotation.z += deltaTime * 0.001;
        }
    }

    /**
     * Handle scroll progress updates
     */
    updateScroll(progress) {
        // Update scene based on scroll progress
        if (this.modelsGroup) {
            this.modelsGroup.rotation.y = progress * Math.PI * 2;
        }
        
        this.emit('scene:scroll-update', progress);
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying MainScene...');
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('touchmove', this.handleTouchMove);
        
        // Destroy material system
        if (this.materialSystem) {
            this.materialSystem.destroy();
        }
        
        // Clear references
        this.models = {};
        this.materials = {};
        
        super.destroy();
        this.logger.info('MainScene destroyed');
    }
}

export default MainScene;