/**
 * TRANSLINK - Asset Manager
 * Handles loading and management of 3D assets, textures, and resources
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { Logger } from '../utils/Logger.js'
import { EventEmitter } from '../utils/EventEmitter.js'

/**
 * AssetManager - Centralized asset loading and management
 */
export class AssetManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('AssetManager');
        this.options = {
            debug: false,
            basePath: '/assets',
            ...options
        };
        
        // Loaders
        this.loaders = {};
        
        // Asset storage
        this.assets = {
            models: new Map(),
            textures: new Map(),
            hdris: new Map(),
            audio: new Map()
        };
        
        // Loading state
        this.loadingPromises = [];
        this.loadedCount = 0;
        this.totalCount = 0;
        
        this.logger.info('AssetManager created');
    }

    /**
     * Initialize asset manager
     */
    async init() {
        try {
            this.logger.info('Initializing AssetManager...');
            
            // Set up loaders
            this.setupLoaders();
            
            // Load core assets
            await this.loadCoreAssets();
            
            this.emit('assets:initialized');
            this.logger.info('AssetManager initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize AssetManager:', error);
            throw error;
        }
    }

    /**
     * Set up asset loaders
     */
    setupLoaders() {
        // DRACO loader for compressed models
        this.loaders.draco = new DRACOLoader();
        this.loaders.draco.setDecoderPath(`${this.options.basePath}/draco/`);
        
        // GLTF loader for 3D models
        this.loaders.gltf = new GLTFLoader();
        this.loaders.gltf.setDRACOLoader(this.loaders.draco);
        
        // RGBE loader for HDR environments
        this.loaders.rgbe = new RGBELoader();
        
        // Texture loader
        this.loaders.texture = new THREE.TextureLoader();
        
        // Audio loader
        this.loaders.audio = new THREE.AudioLoader();
        
        this.logger.info('Asset loaders configured');
    }

    /**
     * Load core assets required for the application
     */
    async loadCoreAssets() {
        this.logger.info('Loading core assets...');
        
        const coreAssets = [
            // 3D Models
            {
                type: 'model',
                name: 'earbuds-scene',
                path: 'models/scene-258.glb'
            },
            
            // Textures
            {
                type: 'texture',
                name: 'noise',
                path: 'textures/noise-r.png',
                config: {
                    wrapS: THREE.RepeatWrapping,
                    wrapT: THREE.RepeatWrapping
                }
            },
            {
                type: 'texture',
                name: 'matcap-glass',
                path: 'textures/matcap-glass-01.png',
                config: {
                    colorSpace: THREE.SRGBColorSpace,
                    flipY: false
                }
            },
            
            // Earphone textures
            {
                type: 'texture',
                name: 'earphone-emissive',
                path: 'textures/headphone-emissive-11.webp',
                config: {
                    colorSpace: THREE.SRGBColorSpace,
                    flipY: false
                }
            },
            {
                type: 'texture',
                name: 'earphone-emissive-mask',
                path: 'textures/headphone-emissive-mask-06.webp',
                config: {
                    colorSpace: THREE.SRGBColorSpace,
                    flipY: false
                }
            },
            {
                type: 'texture',
                name: 'earphone-normal',
                path: 'textures/headphone-normal-10.webp',
                config: {
                    flipY: false
                }
            },
            {
                type: 'texture',
                name: 'earphone-roughness-ao',
                path: 'textures/headphone-roughness-ao-03.webp',
                config: {
                    colorSpace: THREE.SRGBColorSpace,
                    flipY: false
                }
            },
            {
                type: 'texture',
                name: 'earphone-silicone',
                path: 'textures/headphone-silicone-19.webp',
                config: {
                    flipY: false
                }
            },
            
            // Case textures
            {
                type: 'texture',
                name: 'case-alpha-ao',
                path: 'textures/case-alpha-ao-03.webp',
                config: {
                    colorSpace: THREE.SRGBColorSpace,
                    flipY: false
                }
            },
            {
                type: 'texture',
                name: 'case-emissive',
                path: 'textures/case-emissive-16.webp',
                config: {
                    colorSpace: THREE.SRGBColorSpace,
                    flipY: false
                }
            },
            {
                type: 'texture',
                name: 'case-matcap-mask',
                path: 'textures/case-matcap-mask-01.webp',
                config: {
                    colorSpace: THREE.SRGBColorSpace,
                    flipY: false
                }
            }
        ];
        
        // Load all core assets
        const promises = coreAssets.map(asset => this.loadAsset(asset));
        this.totalCount = promises.length;
        
        await Promise.all(promises);
        
        this.logger.info(`Loaded ${this.loadedCount}/${this.totalCount} core assets`);
    }

    /**
     * Load a single asset
     */
    async loadAsset(assetConfig) {
        const { type, name, path, config = {} } = assetConfig;
        const fullPath = `${this.options.basePath}/${path}`;
        
        try {
            this.logger.debug(`Loading ${type}: ${name} from ${fullPath}`);
            
            let asset;
            
            switch (type) {
                case 'model':
                    asset = await this.loadModel(fullPath);
                    break;
                case 'texture':
                    asset = await this.loadTexture(fullPath, config);
                    break;
                case 'hdri':
                    asset = await this.loadHDRI(fullPath);
                    break;
                case 'audio':
                    asset = await this.loadAudio(fullPath);
                    break;
                default:
                    throw new Error(`Unknown asset type: ${type}`);
            }
            
            // Store asset
            this.assets[type === 'model' ? 'models' : `${type}s`].set(name, asset);
            
            this.loadedCount++;
            this.emit('asset:loaded', { type, name, asset });
            this.emit('progress', this.loadedCount / this.totalCount);
            
            this.logger.debug(`Loaded ${type}: ${name}`);
            
            return asset;
            
        } catch (error) {
            this.logger.error(`Failed to load ${type} ${name}:`, error);
            throw error;
        }
    }

    /**
     * Load 3D model
     */
    loadModel(path) {
        return new Promise((resolve, reject) => {
            this.loaders.gltf.load(
                path,
                (gltf) => resolve(gltf),
                undefined,
                (error) => reject(error)
            );
        });
    }

    /**
     * Load texture
     */
    loadTexture(path, config = {}) {
        return new Promise((resolve, reject) => {
            this.loaders.texture.load(
                path,
                (texture) => {
                    // Apply configuration
                    Object.assign(texture, config);
                    resolve(texture);
                },
                undefined,
                (error) => reject(error)
            );
        });
    }

    /**
     * Load HDRI environment
     */
    loadHDRI(path) {
        return new Promise((resolve, reject) => {
            this.loaders.rgbe.load(
                path,
                (texture) => resolve(texture),
                undefined,
                (error) => reject(error)
            );
        });
    }

    /**
     * Load audio file
     */
    loadAudio(path) {
        return new Promise((resolve, reject) => {
            this.loaders.audio.load(
                path,
                (buffer) => resolve(buffer),
                undefined,
                (error) => reject(error)
            );
        });
    }

    /**
     * Get asset by type and name
     */
    get(type, name) {
        const collection = this.assets[`${type}s`] || this.assets[type];
        if (!collection) {
            this.logger.warn(`Unknown asset type: ${type}`);
            return null;
        }
        
        const asset = collection.get(name);
        if (!asset) {
            this.logger.warn(`Asset not found: ${type}/${name}`);
            return null;
        }
        
        return asset;
    }

    /**
     * Check if asset exists
     */
    has(type, name) {
        const collection = this.assets[`${type}s`] || this.assets[type];
        return collection ? collection.has(name) : false;
    }

    /**
     * Get all assets of a type
     */
    getAll(type) {
        const collection = this.assets[`${type}s`] || this.assets[type];
        return collection ? Object.fromEntries(collection) : {};
    }

    /**
     * Get loading progress
     */
    getProgress() {
        return this.totalCount > 0 ? this.loadedCount / this.totalCount : 0;
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying AssetManager...');
        
        // Dispose of all assets
        for (const [type, collection] of Object.entries(this.assets)) {
            for (const [name, asset] of collection) {
                if (asset && typeof asset.dispose === 'function') {
                    asset.dispose();
                }
            }
            collection.clear();
        }
        
        // Dispose loaders
        if (this.loaders.draco) {
            this.loaders.draco.dispose();
        }
        
        this.removeAllListeners();
        this.logger.info('AssetManager destroyed');
    }
}