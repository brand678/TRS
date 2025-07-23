/**
 * TRANSLINK - Settings Scene
 * Minimal scene for theme settings page
 */

import * as THREE from 'three'
import { BaseScene } from './BaseScene.js'
import { Logger } from '../../utils/Logger.js'

/**
 * SettingsScene - Minimal background scene for settings page
 */
export class SettingsScene extends BaseScene {
    constructor(options = {}) {
        super({
            id: 'settings-scene',
            ...options
        });
        
        this.logger = new Logger('SettingsScene');
        
        // Scene-specific settings
        this.settings = {
            background: {
                animated: true,
                speed: 0.0005
            },
            particles: {
                count: 100,
                size: 0.02,
                speed: 0.001
            }
        };
        
        // Animated elements
        this.backgroundMesh = null;
        this.particleSystem = null;
        this.animationTime = 0;
        
        this.logger.info('SettingsScene created');
    }

    /**
     * Set up camera for settings scene
     */
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        
        this.camera.position.set(0, 0, 5);
        this.scene.add(this.camera);
        
        this.logger.debug('Settings scene camera set up');
    }

    /**
     * Set up scene background and effects
     */
    setupScene() {
        // Animated gradient background
        this.scene.background = new THREE.Color(0x050D15);
        
        // Minimal lighting
        const ambientLight = new THREE.AmbientLight(0x41a5ff, 0.3);
        this.scene.add(ambientLight);
        
        this.logger.debug('Settings scene setup completed');
    }

    /**
     * Set up animated background
     */
    setupAnimatedBackground() {
        this.logger.info('Setting up animated background...');
        
        try {
            // Create animated background plane
            const geometry = new THREE.PlaneGeometry(20, 20, 32, 32);
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0.0 },
                    uColorA: { value: new THREE.Color(0x050D15) },
                    uColorB: { value: new THREE.Color(0x133153) },
                    uColorC: { value: new THREE.Color(0x41a5ff) }
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    uniform float uTime;
                    
                    void main() {
                        vUv = uv;
                        vPosition = position;
                        
                        vec3 pos = position;
                        pos.z += sin(pos.x * 2.0 + uTime) * 0.1;
                        pos.z += cos(pos.y * 3.0 + uTime * 0.7) * 0.05;
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    uniform float uTime;
                    uniform vec3 uColorA;
                    uniform vec3 uColorB;
                    uniform vec3 uColorC;
                    
                    void main() {
                        vec2 uv = vUv;
                        
                        float noise = sin(uv.x * 10.0 + uTime) * cos(uv.y * 8.0 + uTime * 0.8) * 0.1;
                        float gradient = length(uv - 0.5) + noise;
                        
                        vec3 color = mix(uColorA, uColorB, gradient);
                        color = mix(color, uColorC, sin(uTime + gradient * 5.0) * 0.1 + 0.1);
                        
                        gl_FragColor = vec4(color, 1.0);
                    }
                `,
                side: THREE.DoubleSide
            });
            
            this.backgroundMesh = new THREE.Mesh(geometry, material);
            this.backgroundMesh.position.z = -10;
            this.scene.add(this.backgroundMesh);
            
            this.logger.debug('Animated background created');
            
        } catch (error) {
            this.logger.error('Failed to set up animated background:', error);
        }
    }

    /**
     * Set up particle system
     */
    setupParticleSystem() {
        this.logger.info('Setting up particle system...');
        
        try {
            const particleCount = this.settings.particles.count;
            const geometry = new THREE.BufferGeometry();
            
            // Create particle positions
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                
                // Random positions
                positions[i3] = (Math.random() - 0.5) * 20;
                positions[i3 + 1] = (Math.random() - 0.5) * 20;
                positions[i3 + 2] = (Math.random() - 0.5) * 10;
                
                // Random colors (theme-based)
                const color = new THREE.Color();
                color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.5 + Math.random() * 0.3);
                colors[i3] = color.r;
                colors[i3 + 1] = color.g;
                colors[i3 + 2] = color.b;
                
                // Random sizes
                sizes[i] = Math.random() * this.settings.particles.size;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            
            // Create particle material
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0.0 },
                    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
                },
                vertexShader: `
                    attribute float size;
                    varying vec3 vColor;
                    uniform float uTime;
                    uniform float uPixelRatio;
                    
                    void main() {
                        vColor = color;
                        
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_Position = projectionMatrix * mvPosition;
                        gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    
                    void main() {
                        float distanceToCenter = length(gl_PointCoord - 0.5);
                        if (distanceToCenter > 0.5) discard;
                        
                        float alpha = 1.0 - distanceToCenter * 2.0;
                        gl_FragColor = vec4(vColor, alpha * 0.6);
                    }
                `,
                transparent: true,
                vertexColors: true,
                blending: THREE.AdditiveBlending
            });
            
            this.particleSystem = new THREE.Points(geometry, material);
            this.scene.add(this.particleSystem);
            
            this.logger.debug('Particle system created');
            
        } catch (error) {
            this.logger.error('Failed to set up particle system:', error);
        }
    }

    /**
     * Initialize the settings scene
     */
    async init() {
        await super.init();
        
        try {
            // Set up animated elements
            this.setupAnimatedBackground();
            this.setupParticleSystem();
            
            this.logger.info('SettingsScene initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize SettingsScene:', error);
            throw error;
        }
    }

    /**
     * Apply theme to settings scene
     */
    applyTheme(theme) {
        super.applyTheme(theme);
        
        if (!theme || !theme['3d']) {
            return;
        }
        
        // Update scene background
        this.scene.background = new THREE.Color(theme['3d'].sceneBackground);
        
        // Update animated background colors
        if (this.backgroundMesh && this.backgroundMesh.material.uniforms) {
            this.backgroundMesh.material.uniforms.uColorA.value.set(theme['3d'].sceneBackground);
            this.backgroundMesh.material.uniforms.uColorB.value.set(theme['3d'].envColor);
            this.backgroundMesh.material.uniforms.uColorC.value.set(theme['3d'].fresnelColor);
        }
        
        this.logger.debug('Theme applied to SettingsScene');
    }

    /**
     * Update settings scene
     */
    update(deltaTime, elapsedTime) {
        if (!this.isActive) {
            return;
        }
        
        this.animationTime += deltaTime;
        
        // Update animated background
        if (this.backgroundMesh && this.backgroundMesh.material.uniforms) {
            this.backgroundMesh.material.uniforms.uTime.value = elapsedTime * this.settings.background.speed;
        }
        
        // Update particle system
        if (this.particleSystem) {
            this.particleSystem.material.uniforms.uTime.value = elapsedTime;
            this.particleSystem.rotation.y += deltaTime * this.settings.particles.speed;
            
            // Animate particle positions
            const positions = this.particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(elapsedTime + positions[i]) * 0.001;
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
    }

    /**
     * Handle scroll progress updates (minimal for settings)
     */
    updateScroll(progress) {
        // Minimal scroll interaction for settings scene
        this.emit('scene:scroll-update', progress);
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying SettingsScene...');
        
        // Clear references
        this.backgroundMesh = null;
        this.particleSystem = null;
        
        super.destroy();
        this.logger.info('SettingsScene destroyed');
    }
}

export default SettingsScene;