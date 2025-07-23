/**
 * TRANSLINK - Material System
 * Centralized material creation and management with theme support
 */

import * as THREE from 'three'
import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * MaterialSystem - Handles all material creation, management, and theme updates
 */
export class MaterialSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('MaterialSystem');
        this.options = {
            assets: null,
            themeSystem: null,
            debug: false,
            ...options
        };
        
        // Material registry
        this.materials = new Map();
        this.materialTemplates = new Map();
        
        // Theme colors
        this.themeColors = {
            fresnel: new THREE.Color(0x60b2ff),
            env: new THREE.Color(0x182d3d),
            core: new THREE.Color(0xbec0fe),
            tube: new THREE.Color(0xb2e0ff),
            touchpadBase: new THREE.Color(0xb4dee7),
            touchpadCorners: new THREE.Color(0x8bccda),
            touchpadVisualizer: new THREE.Color(0x60b2ff)
        };
        
        this.logger.info('MaterialSystem created');
    }

    /**
     * Initialize material system
     */
    async init() {
        try {
            this.logger.info('Initializing MaterialSystem...');
            
            // Register material templates
            this.registerMaterialTemplates();
            
            // Set up theme integration
            this.setupThemeIntegration();
            
            this.emit('materials:initialized');
            this.logger.info('MaterialSystem initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize MaterialSystem:', error);
            throw error;
        }
    }

    /**
     * Register material templates
     */
    registerMaterialTemplates() {
        // Earphone glass material
        this.materialTemplates.set('earphone-glass', {
            type: 'shader',
            baseType: THREE.MeshStandardMaterial,
            uniforms: {
                tMatcap: { value: null },
                tEmissiveMask: { value: null },
                tFluidCursor: { value: null },
                uEmissiveTransition: { value: 0 },
                uEmissiveHover: { value: 0 },
                uFresnelTransition: { value: 0 },
                uEnvColor: { value: this.themeColors.env },
                uEnvIntensity: { value: 1.5 },
                COLOR_FRESNEL: { value: this.themeColors.fresnel }
            },
            vertexShader: this.getEarphoneGlassVertexShader(),
            fragmentShader: this.getEarphoneGlassFragmentShader()
        });

        // Earphone base material
        this.materialTemplates.set('earphone-base', {
            type: 'shader',
            baseType: THREE.MeshStandardMaterial,
            uniforms: {
                COLOR_FRESNEL: { value: this.themeColors.fresnel },
                uFresnelTransition: { value: 0 },
                uVolumeUpHover: { value: 0 },
                uVolumeDownHover: { value: 0 },
                uVolumeShadowUp: { value: 0 },
                uVolumeShadowDown: { value: 0 },
                uEnvColor: { value: this.themeColors.env },
                uEnvIntensity: { value: 15 },
                tFluidCursor: { value: null },
                tEmissiveMask: { value: null },
                tVolumeShadowMask: { value: null },
                tMatcap: { value: null }
            },
            vertexShader: this.getEarphoneBaseVertexShader(),
            fragmentShader: this.getEarphoneBaseFragmentShader()
        });

        // Core material
        this.materialTemplates.set('core', {
            type: 'shader',
            baseType: THREE.ShaderMaterial,
            uniforms: {
                uTime: { value: 0.0 },
                COLOR_PURPLE: { value: this.themeColors.core },
                tNoise: { value: null }
            },
            vertexShader: this.getCoreVertexShader(),
            fragmentShader: this.getCoreFragmentShader()
        });

        // Tube material
        this.materialTemplates.set('tube', {
            type: 'shader',
            baseType: THREE.ShaderMaterial,
            uniforms: {
                uColor: { value: this.themeColors.tube },
                uLineSize: { value: 0.0025 },
                uBokeh: { value: 0.0 }
            },
            vertexShader: this.getTubeVertexShader(),
            fragmentShader: this.getTubeFragmentShader()
        });

        // Touchpad material
        this.materialTemplates.set('touchpad', {
            type: 'shader',
            baseType: THREE.ShaderMaterial,
            uniforms: {
                uOpacity: { value: 0.0 },
                uTime: { value: 0.0 },
                uReveal: { value: 0.0 },
                uMouseUv: { value: new THREE.Vector2(0.0, 0.0) },
                uFrequency: { value: 1.0 },
                tNoise: { value: null },
                tMatcap: { value: null },
                COLOR_BASE: { value: this.themeColors.touchpadBase },
                COLOR_CORNERS: { value: this.themeColors.touchpadCorners },
                COLOR_VISUALISER: { value: this.themeColors.touchpadVisualizer }
            },
            vertexShader: this.getTouchpadVertexShader(),
            fragmentShader: this.getTouchpadFragmentShader()
        });

        // Silicone material
        this.materialTemplates.set('silicone', {
            type: 'shader',
            baseType: THREE.ShaderMaterial,
            uniforms: {
                tDiffuse: { value: null },
                COLOR_FRESNEL: { value: this.themeColors.fresnel }
            },
            vertexShader: this.getSiliconeVertexShader(),
            fragmentShader: this.getSiliconeFragmentShader()
        });

        this.logger.info(`Registered ${this.materialTemplates.size} material templates`);
    }

    /**
     * Set up theme integration
     */
    setupThemeIntegration() {
        if (this.options.themeSystem) {
            this.options.themeSystem.on('theme:changed', this.handleThemeChange.bind(this));
            
            // Apply current theme
            const currentTheme = this.options.themeSystem.getCurrentTheme();
            if (currentTheme) {
                this.applyTheme(currentTheme);
            }
        }
        
        this.logger.debug('Theme integration set up');
    }

    /**
     * Handle theme change
     */
    handleThemeChange(theme) {
        this.logger.info('Applying theme to materials');
        this.applyTheme(theme);
    }

    /**
     * Apply theme to all materials
     */
    applyTheme(theme) {
        if (!theme || !theme['3d']) {
            return;
        }
        
        const colors = theme['3d'];
        
        // Update theme colors
        if (colors.fresnelColor) this.themeColors.fresnel.set(colors.fresnelColor);
        if (colors.envColor) this.themeColors.env.set(colors.envColor);
        if (colors.coreColor) this.themeColors.core.set(colors.coreColor);
        if (colors.tubeColor) this.themeColors.tube.set(colors.tubeColor);
        if (colors.touchpadBaseColor) this.themeColors.touchpadBase.set(colors.touchpadBaseColor);
        if (colors.touchpadCornersColor) this.themeColors.touchpadCorners.set(colors.touchpadCornersColor);
        if (colors.touchpadVisualizerColor) this.themeColors.touchpadVisualizer.set(colors.touchpadVisualizerColor);
        
        // Update existing materials
        for (const [name, material] of this.materials) {
            this.updateMaterialTheme(material, colors);
        }
        
        this.emit('materials:theme-applied', theme);
    }

    /**
     * Update individual material with theme colors
     */
    updateMaterialTheme(material, colors) {
        if (!material.uniforms) {
            return;
        }
        
        // Update common uniforms
        if (material.uniforms.COLOR_FRESNEL) {
            material.uniforms.COLOR_FRESNEL.value = this.themeColors.fresnel;
        }
        if (material.uniforms.uEnvColor) {
            material.uniforms.uEnvColor.value = this.themeColors.env;
        }
        if (material.uniforms.COLOR_PURPLE) {
            material.uniforms.COLOR_PURPLE.value = this.themeColors.core;
        }
        if (material.uniforms.uColor) {
            material.uniforms.uColor.value = this.themeColors.tube;
        }
        if (material.uniforms.COLOR_BASE) {
            material.uniforms.COLOR_BASE.value = this.themeColors.touchpadBase;
        }
        if (material.uniforms.COLOR_CORNERS) {
            material.uniforms.COLOR_CORNERS.value = this.themeColors.touchpadCorners;
        }
        if (material.uniforms.COLOR_VISUALISER) {
            material.uniforms.COLOR_VISUALISER.value = this.themeColors.touchpadVisualizer;
        }
    }

    /**
     * Create material from template
     */
    createMaterial(templateName, overrides = {}) {
        const template = this.materialTemplates.get(templateName);
        if (!template) {
            this.logger.error(`Material template not found: ${templateName}`);
            return new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Error material
        }
        
        try {
            let material;
            
            if (template.type === 'shader') {
                // Create shader material
                material = new template.baseType({
                    ...overrides,
                    transparent: true
                });
                
                // Set up uniforms
                const uniforms = { ...template.uniforms };
                
                // Load textures
                this.loadMaterialTextures(uniforms, templateName);
                
                // Apply shader if it's a custom shader material
                if (template.baseType === THREE.ShaderMaterial) {
                    material = new THREE.ShaderMaterial({
                        uniforms,
                        vertexShader: template.vertexShader,
                        fragmentShader: template.fragmentShader,
                        transparent: true,
                        ...overrides
                    });
                } else {
                    // Apply custom shader to standard material
                    material.onBeforeCompile = (shader) => {
                        this.applyCustomShader(shader, template, uniforms);
                    };
                    material.customProgramCacheKey = () => Math.random().toString();
                }
                
                material.uniforms = uniforms;
            } else {
                // Create standard material
                material = new template.baseType({
                    ...template.properties,
                    ...overrides
                });
            }
            
            // Store material
            const materialId = `${templateName}-${Date.now()}`;
            this.materials.set(materialId, material);
            
            this.logger.debug(`Created material: ${templateName}`);
            return material;
            
        } catch (error) {
            this.logger.error(`Failed to create material ${templateName}:`, error);
            return new THREE.MeshBasicMaterial({ color: 0xff0000 });
        }
    }

    /**
     * Load textures for material
     */
    loadMaterialTextures(uniforms, templateName) {
        if (!this.options.assets) {
            return;
        }
        
        // Load common textures based on template
        switch (templateName) {
            case 'earphone-glass':
                if (uniforms.tMatcap) {
                    uniforms.tMatcap.value = this.options.assets.get('texture', 'matcap-glass');
                }
                if (uniforms.tEmissiveMask) {
                    uniforms.tEmissiveMask.value = this.options.assets.get('texture', 'earphone-emissive-mask');
                }
                break;
                
            case 'earphone-base':
                if (uniforms.tMatcap) {
                    uniforms.tMatcap.value = this.options.assets.get('texture', 'matcap-glass');
                }
                if (uniforms.tEmissiveMask) {
                    uniforms.tEmissiveMask.value = this.options.assets.get('texture', 'earphone-emissive-mask');
                }
                break;
                
            case 'core':
            case 'touchpad':
                if (uniforms.tNoise) {
                    uniforms.tNoise.value = this.options.assets.get('texture', 'noise');
                }
                break;
                
            case 'silicone':
                if (uniforms.tDiffuse) {
                    uniforms.tDiffuse.value = this.options.assets.get('texture', 'earphone-silicone');
                }
                break;
        }
    }

    /**
     * Apply custom shader to material
     */
    applyCustomShader(shader, template, uniforms) {
        // Add uniforms to shader
        Object.assign(shader.uniforms, uniforms);
        
        // Modify vertex shader
        if (template.vertexShader) {
            shader.vertexShader = this.injectShaderCode(
                shader.vertexShader,
                template.vertexShader
            );
        }
        
        // Modify fragment shader
        if (template.fragmentShader) {
            shader.fragmentShader = this.injectShaderCode(
                shader.fragmentShader,
                template.fragmentShader
            );
        }
    }

    /**
     * Inject custom shader code into existing shader
     */
    injectShaderCode(originalShader, customShader) {
        // This is a simplified injection - in practice, you'd have more sophisticated
        // shader code injection based on the specific material needs
        return customShader;
    }

    /**
     * Update materials (called each frame)
     */
    update(deltaTime, elapsedTime) {
        // Update time-based uniforms
        for (const [name, material] of this.materials) {
            if (material.uniforms && material.uniforms.uTime) {
                material.uniforms.uTime.value = elapsedTime;
            }
        }
    }

    /**
     * Get shader code for earphone glass material
     */
    getEarphoneGlassVertexShader() {
        return `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec4 vViewPosition;
            varying vec3 vTransformed;
            varying vec4 vNormalizedViewPosition;
            
            void main() {
                vUv = uv;
                vViewPosition = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalMatrix * normal;
                vTransformed = position;
                vNormalizedViewPosition = projectionMatrix * vViewPosition;
                
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get shader code for earphone glass material
     */
    getEarphoneGlassFragmentShader() {
        return `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec4 vViewPosition;
            varying vec3 vTransformed;
            varying vec4 vNormalizedViewPosition;
            
            uniform sampler2D tMatcap;
            uniform sampler2D tEmissiveMask;
            uniform sampler2D tFluidCursor;
            uniform vec3 COLOR_FRESNEL;
            uniform float uEmissiveTransition;
            uniform float uEmissiveHover;
            uniform float uFresnelTransition;
            uniform vec3 uEnvColor;
            uniform float uEnvIntensity;
            
            void main() {
                vec3 viewDirection = normalize(vViewPosition.xyz);
                float fresnel = 1.0 - dot(viewDirection, normalize(vNormal));
                
                vec3 x = normalize(vec3(viewDirection.z, 0.0, -viewDirection.x));
                vec3 y = cross(viewDirection, x);
                vec2 matcapUV = vec2(dot(x, vNormal), dot(y, vNormal)) * 0.495 + 0.5;
                
                vec3 matcapColor = texture2D(tMatcap, matcapUV).rgb;
                float emissiveMask = 1.0 - texture2D(tEmissiveMask, vUv).r;
                
                vec3 baseColor = mix(vec3(1.0), COLOR_FRESNEL, 0.75) * pow(fresnel, 2.0) + 
                                pow(fresnel, 4.0) * 0.5 + 
                                pow(matcapColor.r, 3.0) * 0.1 + 
                                (uEnvColor * uEnvIntensity);
                
                vec3 fresnelColor = min(COLOR_FRESNEL + pow(fresnel, 3.0), 1.0);
                
                float baseAlpha = 0.9 + baseColor.r * 0.1;
                float fresnelAlpha = max(fresnel, 0.0);
                
                vec3 finalColor = mix(baseColor, fresnelColor, uFresnelTransition);
                float finalAlpha = mix(baseAlpha, fresnelAlpha, uFresnelTransition);
                
                gl_FragColor = vec4(finalColor, finalAlpha);
            }
        `;
    }

    /**
     * Get vertex shader for earphone base material
     */
    getEarphoneBaseVertexShader() {
        return `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec4 vViewPosition;
            varying vec3 vTransformed;
            varying vec4 vNormalizedViewPosition;
            
            void main() {
                vUv = uv;
                vViewPosition = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalMatrix * normal;
                vTransformed = position;
                vNormalizedViewPosition = projectionMatrix * vViewPosition;
                
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get fragment shader for earphone base material
     */
    getEarphoneBaseFragmentShader() {
        return `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec4 vViewPosition;
            varying vec3 vTransformed;
            varying vec4 vNormalizedViewPosition;
            
            uniform float uFresnelTransition;
            uniform float uVolumeUpHover;
            uniform float uVolumeDownHover;
            uniform float uVolumeShadowUp;
            uniform float uVolumeShadowDown;
            uniform vec3 uEnvColor;
            uniform float uEnvIntensity;
            uniform sampler2D tFluidCursor;
            uniform sampler2D tEmissiveMask;
            uniform sampler2D tVolumeShadowMask;
            uniform sampler2D tMatcap;
            uniform vec3 COLOR_FRESNEL;
            
            void main() {
                vec3 viewDirection = normalize(vViewPosition.xyz);
                float fresnel = 1.0 - dot(viewDirection, normalize(vNormal));
                
                vec3 emissiveMask = texture2D(tEmissiveMask, vUv).rgb;
                vec3 volumeShadowMask = texture2D(tVolumeShadowMask, vUv).rgb;
                
                float hoverMaskUp = emissiveMask.g * (0.75 + uVolumeUpHover * 0.5);
                float hoverMaskDown = emissiveMask.b * (0.75 + uVolumeDownHover * 0.5);
                
                float shadowUp = volumeShadowMask.g * uVolumeShadowUp;
                float shadowDown = volumeShadowMask.b * uVolumeShadowDown;
                
                vec3 baseColor = (uEnvColor * uEnvIntensity) - (shadowUp + shadowDown);
                vec3 fresnelColor = min(COLOR_FRESNEL + pow(fresnel, 3.0), 1.0);
                
                vec3 finalColor = mix(baseColor, fresnelColor, uFresnelTransition);
                float finalAlpha = mix(1.0, max(fresnel, 0.0), uFresnelTransition);
                
                gl_FragColor = vec4(finalColor, finalAlpha);
            }
        `;
    }

    /**
     * Get vertex shader for core material
     */
    getCoreVertexShader() {
        return `
            varying vec2 vUv;
            varying vec4 vViewPosition;
            varying vec3 vNormal;
            
            void main() {
                vUv = uv;
                vViewPosition = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalMatrix * normal;
                
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get fragment shader for core material
     */
    getCoreFragmentShader() {
        return `
            varying vec2 vUv;
            varying vec4 vViewPosition;
            varying vec3 vNormal;
            
            uniform float uTime;
            uniform vec3 COLOR_PURPLE;
            uniform sampler2D tNoise;
            
            void main() {
                float textureDistort = texture2D(tNoise, vUv * 4.0 + uTime * 0.1).r;
                float textureNoise = texture2D(tNoise, vUv + (textureDistort * 2.0 + 1.0) * 0.1 + uTime * 0.01).r;
                
                float fresnel = dot(normalize(-vViewPosition.xyz), normalize(vNormal));
                fresnel = 1.0 - pow(fresnel, 2.0);
                
                float final = smoothstep(0.35, 0.5, textureNoise);
                final -= smoothstep(0.5, 0.75, textureDistort) * 0.25;
                final += fresnel;
                final = min(final, 1.0);
                
                vec3 color = mix(COLOR_PURPLE, vec3(1.0), final);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    /**
     * Get vertex shader for tube material
     */
    getTubeVertexShader() {
        return `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get fragment shader for tube material
     */
    getTubeFragmentShader() {
        return `
            varying vec2 vUv;
            
            uniform vec3 uColor;
            uniform float uLineSize;
            uniform float uBokeh;
            
            void main() {
                vec2 uv0 = vec2(vUv.x * 35.0, vUv.y * 22.5);
                
                float maskY = distance(fract(uv0.y), 0.5);
                maskY = 1.0 - smoothstep(0.0 + uLineSize, 0.0 + uLineSize + uBokeh, maskY);
                
                float maskX = distance(fract(uv0.x), 0.5);
                maskX = 1.0 - smoothstep(0.0 + uLineSize, 0.0 + uLineSize + uBokeh, maskX);
                
                float maskSkew = distance(fract(uv0.x + (uv0.y + 0.5)), 0.5);
                maskSkew = 1.0 - smoothstep(0.0 + uLineSize * 2.0, 0.0 + uLineSize * 2.0 + uBokeh * 2.0, maskSkew);
                
                float mask = min(maskY + maskX + maskSkew, 1.0);
                float alpha = smoothstep(0.7, 0.6, vUv.y) * 0.1 - uBokeh;
                
                gl_FragColor = vec4(uColor, alpha * mask);
            }
        `;
    }

    /**
     * Get vertex shader for touchpad material
     */
    getTouchpadVertexShader() {
        return `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec4 vViewPosition;
            
            void main() {
                vUv = uv;
                vViewPosition = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalMatrix * normal;
                
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get fragment shader for touchpad material
     */
    getTouchpadFragmentShader() {
        return `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec4 vViewPosition;
            
            uniform sampler2D tNoise;
            uniform sampler2D tMatcap;
            uniform float uOpacity;
            uniform float uTime;
            uniform float uReveal;
            uniform float uFrequency;
            uniform vec3 COLOR_BASE;
            uniform vec3 COLOR_CORNERS;
            uniform vec3 COLOR_VISUALISER;
            uniform vec2 uMouseUv;
            
            void main() {
                vec2 uv0 = vUv * 2.0 - 1.0;
                vec2 mousePosition = (uMouseUv * 2.0 - 1.0);
                
                float dist = length(uv0);
                float visualiserDist = distance(uv0, vec2(0.0) + mousePosition * 0.33);
                
                float reveal = -0.5 + uReveal * 1.5;
                
                float distortion = texture2D(tNoise, uv0 * (0.75 + (1.0 - dist) * 2.0) + uTime).r * 2.0 - 1.0;
                float noise = texture2D(tNoise, vUv + uTime + distortion * 0.1).r;
                noise = smoothstep(0.5 - reveal - distortion * (1.0 - dist), 1.0 - reveal - distortion * (1.0 - dist), 1.0 - dist);
                
                float baseGradient = smoothstep(0.5, 1.0, dist);
                vec3 base = mix(COLOR_BASE, COLOR_CORNERS, baseGradient);
                
                float visualiserNoiseR = texture2D(tNoise, vUv * 0.33 + uTime * 0.33).r * 2.0 - 1.0;
                float visualiserNoiseG = texture2D(tNoise, vUv * 0.33 + uTime * 0.66).g * 2.0 - 1.0;
                float visualiserNoiseB = texture2D(tNoise, vUv * 0.33 + uTime * 1.0).b * 2.0 - 1.0;
                
                float visualiserR = visualiserDist + visualiserNoiseR * uFrequency;
                float visualiserG = visualiserDist + visualiserNoiseG * uFrequency;
                float visualiserB = visualiserDist + visualiserNoiseB * uFrequency;
                
                visualiserR = smoothstep(0.5, 1.0, visualiserR);
                visualiserG = smoothstep(0.5, 1.0, visualiserG);
                visualiserB = smoothstep(0.5, 1.0, visualiserB);
                
                vec3 visualiser = vec3(visualiserR, visualiserG, visualiserB);
                vec3 final = mix(base, COLOR_VISUALISER, visualiser);
                
                float fresnel = 1.0 - dot(normalize(-vViewPosition.xyz), normalize(vNormal));
                fresnel = pow(fresnel, 2.0);
                
                gl_FragColor = vec4(final + fresnel * 0.5, noise * smoothstep(0.0, 0.5, uReveal) * smoothstep(1.0, 0.8 + min(1.0 - visualiserDist, 0.15), dist));
            }
        `;
    }

    /**
     * Get vertex shader for silicone material
     */
    getSiliconeVertexShader() {
        return `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec4 vViewPosition;
            varying float vLight;
            
            void main() {
                vLight = smoothstep(0.85, 1.0, dot(normalize(normalMatrix * normal), normalize(vec3(1.0, 1.0, 0.0))));
                vUv = uv;
                vViewPosition = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalMatrix * normal;
                
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get fragment shader for silicone material
     */
    getSiliconeFragmentShader() {
        return `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec4 vViewPosition;
            varying float vLight;
            
            uniform sampler2D tDiffuse;
            uniform vec3 COLOR_FRESNEL;
            
            void main() {
                vec3 textureDiffuse = texture2D(tDiffuse, vUv).rgb;
                gl_FragColor = vec4(textureDiffuse + vLight, 1.0);
            }
        `;
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying MaterialSystem...');
        
        // Dispose of all materials
        for (const [name, material] of this.materials) {
            if (material.dispose) {
                material.dispose();
            }
        }
        
        this.materials.clear();
        this.materialTemplates.clear();
        
        this.removeAllListeners();
        this.logger.info('MaterialSystem destroyed');
    }
}

export { MaterialSystem };