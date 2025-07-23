/**
 * TRANSLINK - Particle System
 * Advanced particle effects for enhanced visual appeal
 */

import * as THREE from 'three'
import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * ParticleSystem - Advanced particle effects with GPU computation
 */
export class ParticleSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('ParticleSystem');
        this.options = {
            count: 1000,
            size: 0.1,
            speed: 1.0,
            color: 0x60b2ff,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            ...options
        };
        
        // Core components
        this.geometry = null;
        this.material = null;
        this.mesh = null;
        this.group = new THREE.Group();
        
        // Animation state
        this.time = 0;
        this.isAnimating = false;
        
        // GPU computation (if available)
        this.gpuCompute = null;
        this.positionVariable = null;
        this.velocityVariable = null;
        
        this.logger.info('ParticleSystem created');
    }

    /**
     * Initialize particle system
     */
    async init() {
        try {
            this.logger.info('Initializing ParticleSystem...');
            
            // Try to set up GPU computation first
            await this.setupGPUComputation();
            
            // If GPU computation fails, fall back to CPU particles
            if (!this.gpuCompute) {
                this.setupCPUParticles();
            }
            
            this.emit('particles:initialized');
            this.logger.info('ParticleSystem initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize ParticleSystem:', error);
            throw error;
        }
    }

    /**
     * Set up GPU-based particle computation
     */
    async setupGPUComputation() {
        try {
            // Import GPU computation renderer
            const { GPUComputationRenderer } = await import('three/examples/jsm/misc/GPUComputationRenderer.js');
            
            if (!this.options.renderer) {
                throw new Error('Renderer required for GPU computation');
            }
            
            // Calculate texture size for particles
            const textureSize = Math.ceil(Math.sqrt(this.options.count));
            this.gpuCompute = new GPUComputationRenderer(textureSize, textureSize, this.options.renderer);
            
            // Create initial position texture
            const positionTexture = this.gpuCompute.createTexture();
            this.fillPositionTexture(positionTexture);
            
            // Create initial velocity texture
            const velocityTexture = this.gpuCompute.createTexture();
            this.fillVelocityTexture(velocityTexture);
            
            // Set up position variable
            this.positionVariable = this.gpuCompute.addVariable('texturePosition', this.getPositionShader(), positionTexture);
            this.velocityVariable = this.gpuCompute.addVariable('textureVelocity', this.getVelocityShader(), velocityTexture);
            
            // Set dependencies
            this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);
            this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);
            
            // Add uniforms
            this.positionVariable.material.uniforms.time = { value: 0.0 };
            this.positionVariable.material.uniforms.delta = { value: 0.0 };
            this.velocityVariable.material.uniforms.time = { value: 0.0 };
            this.velocityVariable.material.uniforms.delta = { value: 0.0 };
            
            // Initialize GPU computation
            const error = this.gpuCompute.init();
            if (error !== null) {
                throw new Error('GPU computation initialization failed: ' + error);
            }
            
            // Create particle geometry for GPU particles
            this.setupGPUParticleGeometry(textureSize);
            
            this.logger.info('GPU particle computation set up successfully');
            
        } catch (error) {
            this.logger.warn('GPU computation not available, falling back to CPU particles:', error);
            this.gpuCompute = null;
        }
    }

    /**
     * Fill position texture with initial particle positions
     */
    fillPositionTexture(texture) {
        const data = texture.image.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // Random sphere distribution
            const radius = Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            data[i] = radius * Math.sin(phi) * Math.cos(theta);     // x
            data[i + 1] = radius * Math.sin(phi) * Math.sin(theta); // y
            data[i + 2] = radius * Math.cos(phi);                   // z
            data[i + 3] = Math.random();                            // life
        }
    }

    /**
     * Fill velocity texture with initial particle velocities
     */
    fillVelocityTexture(texture) {
        const data = texture.image.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = (Math.random() - 0.5) * 0.1;     // vx
            data[i + 1] = (Math.random() - 0.5) * 0.1; // vy
            data[i + 2] = (Math.random() - 0.5) * 0.1; // vz
            data[i + 3] = Math.random();               // random
        }
    }

    /**
     * Get position computation shader
     */
    getPositionShader() {
        return `
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 tmpPos = texture2D(texturePosition, uv);
                vec4 tmpVel = texture2D(textureVelocity, uv);
                
                vec3 position = tmpPos.xyz;
                vec3 velocity = tmpVel.xyz;
                float life = tmpPos.w;
                
                // Update position
                position += velocity * delta;
                
                // Update life
                life -= delta * 0.1;
                
                // Reset if dead
                if (life <= 0.0) {
                    life = 1.0;
                    position = vec3(
                        (rand(uv + time) - 0.5) * 10.0,
                        (rand(uv.yx + time) - 0.5) * 10.0,
                        (rand(uv.xx + time) - 0.5) * 10.0
                    );
                }
                
                gl_FragColor = vec4(position, life);
            }
            
            float rand(vec2 co) {
                return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
            }
        `;
    }

    /**
     * Get velocity computation shader
     */
    getVelocityShader() {
        return `
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 tmpPos = texture2D(texturePosition, uv);
                vec4 tmpVel = texture2D(textureVelocity, uv);
                
                vec3 position = tmpPos.xyz;
                vec3 velocity = tmpVel.xyz;
                
                // Apply forces
                vec3 force = vec3(0.0);
                
                // Gravity
                force.y -= 0.1;
                
                // Turbulence
                force += vec3(
                    sin(position.x * 0.1 + time) * 0.05,
                    cos(position.y * 0.1 + time) * 0.05,
                    sin(position.z * 0.1 + time) * 0.05
                );
                
                // Update velocity
                velocity += force * delta;
                velocity *= 0.99; // Damping
                
                gl_FragColor = vec4(velocity, tmpVel.w);
            }
        `;
    }

    /**
     * Set up geometry for GPU particles
     */
    setupGPUParticleGeometry(textureSize) {
        const geometry = new THREE.BufferGeometry();
        
        // Create UV coordinates for texture lookup
        const uvs = new Float32Array(this.options.count * 2);
        const indices = new Float32Array(this.options.count);
        
        for (let i = 0; i < this.options.count; i++) {
            const x = (i % textureSize) / textureSize;
            const y = Math.floor(i / textureSize) / textureSize;
            
            uvs[i * 2] = x;
            uvs[i * 2 + 1] = y;
            indices[i] = i;
        }
        
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setAttribute('index', new THREE.BufferAttribute(indices, 1));
        
        // Create material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                texturePosition: { value: null },
                textureVelocity: { value: null },
                uTime: { value: 0.0 },
                uSize: { value: this.options.size },
                uColor: { value: new THREE.Color(this.options.color) },
                uOpacity: { value: this.options.opacity }
            },
            vertexShader: `
                uniform sampler2D texturePosition;
                uniform sampler2D textureVelocity;
                uniform float uTime;
                uniform float uSize;
                
                varying float vLife;
                varying vec3 vVelocity;
                
                void main() {
                    vec4 positionInfo = texture2D(texturePosition, uv);
                    vec4 velocityInfo = texture2D(textureVelocity, uv);
                    
                    vec3 pos = positionInfo.xyz;
                    vLife = positionInfo.w;
                    vVelocity = velocityInfo.xyz;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = uSize * (300.0 / -mvPosition.z) * vLife;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uOpacity;
                
                varying float vLife;
                varying vec3 vVelocity;
                
                void main() {
                    float distanceToCenter = length(gl_PointCoord - 0.5);
                    if (distanceToCenter > 0.5) discard;
                    
                    float alpha = (1.0 - distanceToCenter * 2.0) * vLife * uOpacity;
                    vec3 color = uColor + length(vVelocity) * 0.5;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: this.options.blending
        });
        
        this.geometry = geometry;
        this.material = material;
        this.mesh = new THREE.Points(geometry, material);
        this.group.add(this.mesh);
    }

    /**
     * Set up CPU-based particles (fallback)
     */
    setupCPUParticles() {
        this.logger.info('Setting up CPU particle system...');
        
        const geometry = new THREE.BufferGeometry();
        
        // Create particle attributes
        const positions = new Float32Array(this.options.count * 3);
        const velocities = new Float32Array(this.options.count * 3);
        const colors = new Float32Array(this.options.count * 3);
        const sizes = new Float32Array(this.options.count);
        const life = new Float32Array(this.options.count);
        
        for (let i = 0; i < this.options.count; i++) {
            const i3 = i * 3;
            
            // Random positions
            positions[i3] = (Math.random() - 0.5) * 10;
            positions[i3 + 1] = (Math.random() - 0.5) * 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 10;
            
            // Random velocities
            velocities[i3] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
            
            // Colors
            const color = new THREE.Color(this.options.color);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // Sizes and life
            sizes[i] = Math.random() * this.options.size;
            life[i] = Math.random();
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('life', new THREE.BufferAttribute(life, 1));
        
        // Create material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0.0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
                uOpacity: { value: this.options.opacity }
            },
            vertexShader: `
                attribute vec3 velocity;
                attribute float size;
                attribute float life;
                
                uniform float uTime;
                uniform float uPixelRatio;
                
                varying vec3 vColor;
                varying float vLife;
                
                void main() {
                    vColor = color;
                    vLife = life;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z) * life;
                }
            `,
            fragmentShader: `
                uniform float uOpacity;
                
                varying vec3 vColor;
                varying float vLife;
                
                void main() {
                    float distanceToCenter = length(gl_PointCoord - 0.5);
                    if (distanceToCenter > 0.5) discard;
                    
                    float alpha = (1.0 - distanceToCenter * 2.0) * vLife * uOpacity;
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: this.options.blending
        });
        
        this.geometry = geometry;
        this.material = material;
        this.mesh = new THREE.Points(geometry, material);
        this.group.add(this.mesh);
        
        this.logger.info('CPU particle system set up successfully');
    }

    /**
     * Start particle animation
     */
    start() {
        this.isAnimating = true;
        this.emit('particles:started');
        this.logger.debug('Particle animation started');
    }

    /**
     * Stop particle animation
     */
    stop() {
        this.isAnimating = false;
        this.emit('particles:stopped');
        this.logger.debug('Particle animation stopped');
    }

    /**
     * Update particle system
     */
    update(deltaTime, elapsedTime) {
        if (!this.isAnimating) {
            return;
        }
        
        this.time = elapsedTime;
        
        if (this.gpuCompute) {
            // Update GPU particles
            this.updateGPUParticles(deltaTime);
        } else {
            // Update CPU particles
            this.updateCPUParticles(deltaTime);
        }
        
        // Update material uniforms
        if (this.material && this.material.uniforms) {
            this.material.uniforms.uTime.value = elapsedTime;
        }
    }

    /**
     * Update GPU particles
     */
    updateGPUParticles(deltaTime) {
        // Update computation uniforms
        this.positionVariable.material.uniforms.time.value = this.time;
        this.positionVariable.material.uniforms.delta.value = deltaTime;
        this.velocityVariable.material.uniforms.time.value = this.time;
        this.velocityVariable.material.uniforms.delta.value = deltaTime;
        
        // Compute
        this.gpuCompute.compute();
        
        // Update material uniforms
        this.material.uniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
        this.material.uniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
    }

    /**
     * Update CPU particles
     */
    updateCPUParticles(deltaTime) {
        const positions = this.geometry.attributes.position.array;
        const velocities = this.geometry.attributes.velocity.array;
        const life = this.geometry.attributes.life.array;
        
        for (let i = 0; i < this.options.count; i++) {
            const i3 = i * 3;
            
            // Update positions
            positions[i3] += velocities[i3] * deltaTime * this.options.speed;
            positions[i3 + 1] += velocities[i3 + 1] * deltaTime * this.options.speed;
            positions[i3 + 2] += velocities[i3 + 2] * deltaTime * this.options.speed;
            
            // Update life
            life[i] -= deltaTime * 0.1;
            
            // Reset if dead
            if (life[i] <= 0) {
                life[i] = 1.0;
                positions[i3] = (Math.random() - 0.5) * 10;
                positions[i3 + 1] = (Math.random() - 0.5) * 10;
                positions[i3 + 2] = (Math.random() - 0.5) * 10;
            }
        }
        
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.life.needsUpdate = true;
    }

    /**
     * Set particle color
     */
    setColor(color) {
        if (this.material && this.material.uniforms && this.material.uniforms.uColor) {
            this.material.uniforms.uColor.value.set(color);
        }
        
        this.emit('particles:color-changed', color);
    }

    /**
     * Set particle opacity
     */
    setOpacity(opacity) {
        this.options.opacity = opacity;
        
        if (this.material && this.material.uniforms && this.material.uniforms.uOpacity) {
            this.material.uniforms.uOpacity.value = opacity;
        }
        
        this.emit('particles:opacity-changed', opacity);
    }

    /**
     * Get the particle group for adding to scene
     */
    getGroup() {
        return this.group;
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying ParticleSystem...');
        
        this.stop();
        
        // Dispose of GPU computation
        if (this.gpuCompute) {
            // Note: GPUComputationRenderer doesn't have a dispose method
            this.gpuCompute = null;
        }
        
        // Dispose of geometry and material
        if (this.geometry) {
            this.geometry.dispose();
        }
        
        if (this.material) {
            this.material.dispose();
        }
        
        // Clear group
        this.group.clear();
        
        this.removeAllListeners();
        this.logger.info('ParticleSystem destroyed');
    }
}

export { ParticleSystem };