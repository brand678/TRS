/**
 * TRANSLINK - Theme Updater
 * Updates WebGL materials and scenes based on theme changes
 */

import * as THREE from 'three'
import { Logger } from '../utils/Logger.js'

/**
 * ThemeUpdater - Applies theme changes to WebGL materials and scenes
 */
export class ThemeUpdater {
    constructor(options = {}) {
        this.logger = new Logger('ThemeUpdater');
        this.options = {
            webgl: null,
            debug: false,
            ...options
        };
        
        this.webgl = this.options.webgl;
        this.materialCache = new Map();
        
        this.logger.info('ThemeUpdater created');
    }

    /**
     * Set WebGL manager
     */
    setWebGL(webgl) {
        this.webgl = webgl;
        this.logger.info('WebGL manager connected to ThemeUpdater');
    }

    /**
     * Update WebGL with new theme
     */
    updateWebGL(theme) {
        if (!this.webgl || !theme) {
            this.logger.warn('WebGL or theme not available for update');
            return;
        }
        
        this.logger.info(`Updating WebGL with theme: ${theme.name}`);
        
        try {
            // Update scene backgrounds
            this.updateSceneBackgrounds(theme);
            
            // Update materials
            this.updateMaterials(theme);
            
            // Update lighting
            this.updateLighting(theme);
            
            this.logger.debug('WebGL theme update completed');
            
        } catch (error) {
            this.logger.error('Failed to update WebGL theme:', error);
        }
    }

    /**
     * Update scene background colors
     */
    updateSceneBackgrounds(theme) {
        if (!theme['3d'] || !theme['3d'].sceneBackground) {
            return;
        }
        
        const backgroundColor = new THREE.Color(theme['3d'].sceneBackground);
        
        // Update all scenes
        const scenes = this.webgl.scenes;
        if (scenes && scenes.getAllScenes) {
            const allScenes = scenes.getAllScenes();
            
            allScenes.forEach(scene => {
                if (scene.scene && scene.scene.background) {
                    scene.scene.background = backgroundColor;
                }
            });
        }
        
        this.logger.debug(`Updated scene backgrounds to: ${theme['3d'].sceneBackground}`);
    }

    /**
     * Update material colors
     */
    updateMaterials(theme) {
        if (!theme['3d']) {
            return;
        }
        
        const colors = theme['3d'];
        
        // Update fresnel materials
        this.updateFresnelMaterials(colors);
        
        // Update core materials
        this.updateCoreMaterials(colors);
        
        // Update tube materials
        this.updateTubeMaterials(colors);
        
        // Update touchpad materials
        this.updateTouchpadMaterials(colors);
    }

    /**
     * Update fresnel materials
     */
    updateFresnelMaterials(colors) {
        if (!colors.fresnelColor) return;
        
        const fresnelColor = new THREE.Color(colors.fresnelColor);
        
        // Find and update fresnel materials
        this.findAndUpdateMaterials('fresnel', (material) => {
            if (material.uniforms && material.uniforms.COLOR_FRESNEL) {
                material.uniforms.COLOR_FRESNEL.value = fresnelColor;
            }
        });
        
        this.logger.debug(`Updated fresnel color to: ${colors.fresnelColor}`);
    }

    /**
     * Update core materials
     */
    updateCoreMaterials(colors) {
        if (!colors.coreColor) return;
        
        const coreColor = new THREE.Color(colors.coreColor);
        
        this.findAndUpdateMaterials('core', (material) => {
            if (material.uniforms && material.uniforms.COLOR_PURPLE) {
                material.uniforms.COLOR_PURPLE.value = coreColor;
            }
        });
        
        this.logger.debug(`Updated core color to: ${colors.coreColor}`);
    }

    /**
     * Update tube materials
     */
    updateTubeMaterials(colors) {
        if (!colors.tubeColor) return;
        
        const tubeColor = new THREE.Color(colors.tubeColor);
        
        this.findAndUpdateMaterials('tube', (material) => {
            if (material.uniforms && material.uniforms.uColor) {
                material.uniforms.uColor.value = tubeColor;
            }
        });
        
        this.logger.debug(`Updated tube color to: ${colors.tubeColor}`);
    }

    /**
     * Update touchpad materials
     */
    updateTouchpadMaterials(colors) {
        const updates = [
            { key: 'touchpadBaseColor', uniform: 'COLOR_BASE' },
            { key: 'touchpadCornersColor', uniform: 'COLOR_CORNERS' },
            { key: 'touchpadVisualizerColor', uniform: 'COLOR_VISUALISER' }
        ];
        
        updates.forEach(({ key, uniform }) => {
            if (colors[key]) {
                const color = new THREE.Color(colors[key]);
                
                this.findAndUpdateMaterials('touchpad', (material) => {
                    if (material.uniforms && material.uniforms[uniform]) {
                        material.uniforms[uniform].value = color;
                    }
                });
            }
        });
        
        this.logger.debug('Updated touchpad materials');
    }

    /**
     * Update lighting
     */
    updateLighting(theme) {
        if (!theme['3d'] || !theme['3d'].envColor) {
            return;
        }
        
        const envColor = new THREE.Color(theme['3d'].envColor);
        
        // Update environment lighting
        this.findAndUpdateMaterials('env', (material) => {
            if (material.uniforms && material.uniforms.uEnvColor) {
                material.uniforms.uEnvColor.value = envColor;
            }
        });
        
        this.logger.debug(`Updated environment color to: ${theme['3d'].envColor}`);
    }

    /**
     * Find and update materials by type
     */
    findAndUpdateMaterials(type, updateFunction) {
        if (!this.webgl || !this.webgl.scenes) {
            return;
        }
        
        const scenes = this.webgl.scenes.getAllScenes ? this.webgl.scenes.getAllScenes() : [];
        
        scenes.forEach(sceneWrapper => {
            if (sceneWrapper.scene) {
                sceneWrapper.scene.traverse((object) => {
                    if (object.material) {
                        const materials = Array.isArray(object.material) ? 
                                        object.material : [object.material];
                        
                        materials.forEach(material => {
                            // Check if material matches type (basic heuristic)
                            if (this.materialMatchesType(material, type)) {
                                updateFunction(material);
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * Check if material matches a specific type
     */
    materialMatchesType(material, type) {
        // Basic material type detection based on uniforms and properties
        switch (type) {
            case 'fresnel':
                return material.uniforms && material.uniforms.COLOR_FRESNEL;
            case 'core':
                return material.uniforms && material.uniforms.COLOR_PURPLE;
            case 'tube':
                return material.uniforms && material.uniforms.uColor && 
                       material.uniforms.uLineSize;
            case 'touchpad':
                return material.uniforms && (
                    material.uniforms.COLOR_BASE ||
                    material.uniforms.COLOR_CORNERS ||
                    material.uniforms.COLOR_VISUALISER
                );
            case 'env':
                return material.uniforms && material.uniforms.uEnvColor;
            default:
                return false;
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying ThemeUpdater...');
        
        this.materialCache.clear();
        this.webgl = null;
        
        this.logger.info('ThemeUpdater destroyed');
    }
}