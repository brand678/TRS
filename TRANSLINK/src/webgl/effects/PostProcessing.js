/**
 * TRANSLINK - Post Processing
 * Advanced post-processing effects for enhanced visual quality
 */

import * as THREE from 'three'
import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * PostProcessing - Manages post-processing effects pipeline
 */
export class PostProcessing extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('PostProcessing');
        this.options = {
            renderer: null,
            scene: null,
            camera: null,
            enabled: true,
            ...options
        };
        
        // Core components
        this.composer = null;
        this.passes = new Map();
        
        // Effect settings
        this.settings = {
            bloom: {
                strength: 1.5,
                radius: 0.4,
                threshold: 0.85
            },
            fxaa: {
                enabled: true
            },
            tonemap: {
                exposure: 1.0,
                whitePoint: 1.0
            },
            colorCorrection: {
                brightness: 0.0,
                contrast: 1.0,
                saturation: 1.0
            }
        };
        
        this.logger.info('PostProcessing created');
    }

    /**
     * Initialize post-processing pipeline
     */
    async init() {
        try {
            this.logger.info('Initializing PostProcessing...');
            
            if (!this.options.renderer) {
                throw new Error('Renderer is required for post-processing');
            }
            
            // Import post-processing modules
            await this.loadPostProcessingModules();
            
            // Set up composer
            this.setupComposer();
            
            // Add passes
            this.addRenderPass();
            this.addBloomPass();
            this.addFXAAPass();
            this.addColorCorrectionPass();
            this.addOutputPass();
            
            this.emit('postprocessing:initialized');
            this.logger.info('PostProcessing initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize PostProcessing:', error);
            throw error;
        }
    }

    /**
     * Load post-processing modules
     */
    async loadPostProcessingModules() {
        try {
            // Import all required post-processing modules
            const modules = await Promise.all([
                import('three/examples/jsm/postprocessing/EffectComposer.js'),
                import('three/examples/jsm/postprocessing/RenderPass.js'),
                import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
                import('three/examples/jsm/postprocessing/ShaderPass.js'),
                import('three/examples/jsm/postprocessing/OutputPass.js'),
                import('three/examples/jsm/shaders/FXAAShader.js')
            ]);
            
            // Store module references
            this.modules = {
                EffectComposer: modules[0].EffectComposer,
                RenderPass: modules[1].RenderPass,
                UnrealBloomPass: modules[2].UnrealBloomPass,
                ShaderPass: modules[3].ShaderPass,
                OutputPass: modules[4].OutputPass,
                FXAAShader: modules[5].FXAAShader
            };
            
            this.logger.debug('Post-processing modules loaded');
            
        } catch (error) {
            this.logger.error('Failed to load post-processing modules:', error);
            throw error;
        }
    }

    /**
     * Set up effect composer
     */
    setupComposer() {
        this.composer = new this.modules.EffectComposer(this.options.renderer);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        
        this.logger.debug('Effect composer set up');
    }

    /**
     * Add render pass
     */
    addRenderPass() {
        const renderPass = new this.modules.RenderPass(this.options.scene, this.options.camera);
        this.composer.addPass(renderPass);
        this.passes.set('render', renderPass);
        
        this.logger.debug('Render pass added');
    }

    /**
     * Add bloom pass
     */
    addBloomPass() {
        const bloomPass = new this.modules.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.settings.bloom.strength,
            this.settings.bloom.radius,
            this.settings.bloom.threshold
        );
        
        this.composer.addPass(bloomPass);
        this.passes.set('bloom', bloomPass);
        
        this.logger.debug('Bloom pass added');
    }

    /**
     * Add FXAA anti-aliasing pass
     */
    addFXAAPass() {
        if (!this.settings.fxaa.enabled) {
            return;
        }
        
        const fxaaPass = new this.modules.ShaderPass(this.modules.FXAAShader);
        fxaaPass.material.uniforms['resolution'].value.x = 1 / window.innerWidth;
        fxaaPass.material.uniforms['resolution'].value.y = 1 / window.innerHeight;
        
        this.composer.addPass(fxaaPass);
        this.passes.set('fxaa', fxaaPass);
        
        this.logger.debug('FXAA pass added');
    }

    /**
     * Add color correction pass
     */
    addColorCorrectionPass() {
        const colorCorrectionPass = new this.modules.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                uBrightness: { value: this.settings.colorCorrection.brightness },
                uContrast: { value: this.settings.colorCorrection.contrast },
                uSaturation: { value: this.settings.colorCorrection.saturation },
                uExposure: { value: this.settings.tonemap.exposure }
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
                uniform float uBrightness;
                uniform float uContrast;
                uniform float uSaturation;
                uniform float uExposure;
                
                varying vec2 vUv;
                
                vec3 adjustBrightness(vec3 color, float brightness) {
                    return color + brightness;
                }
                
                vec3 adjustContrast(vec3 color, float contrast) {
                    return (color - 0.5) * contrast + 0.5;
                }
                
                vec3 adjustSaturation(vec3 color, float saturation) {
                    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
                    return mix(vec3(luminance), color, saturation);
                }
                
                vec3 toneMap(vec3 color, float exposure) {
                    color *= exposure;
                    return color / (color + vec3(1.0));
                }
                
                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    vec3 color = texel.rgb;
                    
                    // Apply exposure
                    color = toneMap(color, uExposure);
                    
                    // Apply color corrections
                    color = adjustBrightness(color, uBrightness);
                    color = adjustContrast(color, uContrast);
                    color = adjustSaturation(color, uSaturation);
                    
                    gl_FragColor = vec4(color, texel.a);
                }
            `
        });
        
        this.composer.addPass(colorCorrectionPass);
        this.passes.set('colorCorrection', colorCorrectionPass);
        
        this.logger.debug('Color correction pass added');
    }

    /**
     * Add output pass
     */
    addOutputPass() {
        const outputPass = new this.modules.OutputPass();
        this.composer.addPass(outputPass);
        this.passes.set('output', outputPass);
        
        this.logger.debug('Output pass added');
    }

    /**
     * Render with post-processing
     */
    render() {
        if (!this.options.enabled || !this.composer) {
            // Fallback to direct rendering
            this.options.renderer.render(this.options.scene, this.options.camera);
            return;
        }
        
        this.composer.render();
    }

    /**
     * Update post-processing effects
     */
    update(deltaTime, elapsedTime) {
        // Update any time-based effects here
        this.emit('postprocessing:update', { deltaTime, elapsedTime });
    }

    /**
     * Resize post-processing
     */
    resize(width, height) {
        if (this.composer) {
            this.composer.setSize(width, height);
        }
        
        // Update FXAA resolution
        const fxaaPass = this.passes.get('fxaa');
        if (fxaaPass) {
            fxaaPass.material.uniforms['resolution'].value.x = 1 / width;
            fxaaPass.material.uniforms['resolution'].value.y = 1 / height;
        }
        
        this.logger.debug(`Post-processing resized to ${width}x${height}`);
    }

    /**
     * Enable/disable post-processing
     */
    setEnabled(enabled) {
        this.options.enabled = enabled;
        this.emit('postprocessing:enabled-changed', enabled);
        this.logger.debug(`Post-processing ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Update bloom settings
     */
    setBloomSettings(settings) {
        const bloomPass = this.passes.get('bloom');
        if (!bloomPass) return;
        
        if (settings.strength !== undefined) {
            bloomPass.strength = settings.strength;
            this.settings.bloom.strength = settings.strength;
        }
        
        if (settings.radius !== undefined) {
            bloomPass.radius = settings.radius;
            this.settings.bloom.radius = settings.radius;
        }
        
        if (settings.threshold !== undefined) {
            bloomPass.threshold = settings.threshold;
            this.settings.bloom.threshold = settings.threshold;
        }
        
        this.emit('postprocessing:bloom-changed', this.settings.bloom);
    }

    /**
     * Update color correction settings
     */
    setColorCorrectionSettings(settings) {
        const colorCorrectionPass = this.passes.get('colorCorrection');
        if (!colorCorrectionPass) return;
        
        const uniforms = colorCorrectionPass.material.uniforms;
        
        if (settings.brightness !== undefined) {
            uniforms.uBrightness.value = settings.brightness;
            this.settings.colorCorrection.brightness = settings.brightness;
        }
        
        if (settings.contrast !== undefined) {
            uniforms.uContrast.value = settings.contrast;
            this.settings.colorCorrection.contrast = settings.contrast;
        }
        
        if (settings.saturation !== undefined) {
            uniforms.uSaturation.value = settings.saturation;
            this.settings.colorCorrection.saturation = settings.saturation;
        }
        
        if (settings.exposure !== undefined) {
            uniforms.uExposure.value = settings.exposure;
            this.settings.tonemap.exposure = settings.exposure;
        }
        
        this.emit('postprocessing:color-correction-changed', this.settings.colorCorrection);
    }

    /**
     * Get current settings
     */
    getSettings() {
        return {
            enabled: this.options.enabled,
            bloom: { ...this.settings.bloom },
            fxaa: { ...this.settings.fxaa },
            tonemap: { ...this.settings.tonemap },
            colorCorrection: { ...this.settings.colorCorrection }
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying PostProcessing...');
        
        // Dispose of composer
        if (this.composer) {
            this.composer.dispose();
        }
        
        // Clear passes
        this.passes.clear();
        
        this.removeAllListeners();
        this.logger.info('PostProcessing destroyed');
    }
}

export { PostProcessing };