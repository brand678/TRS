import * as THREE from 'three'
import {
    GPUComputationRenderer
} from 'three/addons/misc/GPUComputationRenderer.js'
import gsap from '@/gsap'

import Gl from '@/gl/Gl'
import {
    Scroll
} from '@/scroll'

export default class Particles {
    constructor() {
        this.gl = new Gl()

        this.instance = new THREE.Group()

        /* 
          Settings
        */
        this.settings = {
            scale: 0.25,
        }

        /* 
          Global
        */
        this.globalSpeed = 1.0

        /* 
          Base Geometry
        */
        this.baseGeometry = {}
        this.baseGeometry.instance = new THREE.TorusGeometry(5, this.settings.scale, 48, 48)
        this.baseGeometry.count = this.baseGeometry.instance.attributes.position.count

        /* 
          GPU Compute
        */
        this.gpgpu = {}
        this.gpgpu.size = Math.ceil(Math.sqrt(this.baseGeometry.count))

        this.gpgpu.computation = new GPUComputationRenderer(this.gpgpu.size, this.gpgpu.size, this.gl.renderer.instance)

        this.baseParticlesTexture = this.gpgpu.computation.createTexture()

        for (let i = 0; i < this.baseGeometry.count; i++) {
            this.baseParticlesTexture.image.data[i * 4 + 0] = this.baseGeometry.instance.attributes.position.array[i * 3 + 0] + (2 * Math.random() - 1) * this.settings.scale
            this.baseParticlesTexture.image.data[i * 4 + 1] = this.baseGeometry.instance.attributes.position.array[i * 3 + 1] + (2 * Math.random() - 1) * this.settings.scale
            this.baseParticlesTexture.image.data[i * 4 + 2] = this.baseGeometry.instance.attributes.position.array[i * 3 + 2] + (2 * Math.random() - 1) * this.settings.scale
            this.baseParticlesTexture.image.data[i * 4 + 3] = Math.random()
        }

        this.shader = /* glsl */ `
      #include <simplex>

      uniform float uTime;
      uniform float uTransition;
      uniform float uDeltaTime;
      uniform float uFrequency;

      uniform sampler2D uBasePositions;

      const float FLOWFIELD_SIZE = .25;
      const float FLOWFIELD_CHUNK_SIZE = 10.;
      const float FLOWFIELD_STRENGTH = 5.;

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec4 particleTexture = texture2D(uParticles, uv);
        vec4 basePositionTexture = texture2D(uBasePositions, uv);

        if (particleTexture.a >= 1.0) {
          // If Dead
          particleTexture.a = fract(particleTexture.a);
          particleTexture.xyz = basePositionTexture.xyz;
        } else {
          // Distribution Strength
          // float distributionStrength = simplexNoise4d(vec4(basePositionTexture.xyz * FLOWFIELD_CHUNK_SIZE, uTime * 0.1 + 1.0));
          // distributionStrength = smoothstep(0.0, 1.0, distributionStrength);

          // If Alive, apply flow field
          vec3 flowField = vec3(
            simplexNoise4d(vec4(particleTexture.xyz * FLOWFIELD_SIZE + 0.0, uTime * 0.25)),
            simplexNoise4d(vec4(particleTexture.xyz * FLOWFIELD_SIZE + 1.0, uTime * 0.25)),
            simplexNoise4d(vec4(particleTexture.xyz * FLOWFIELD_SIZE + 2.0, uTime * 0.25))
          );

          flowField = normalize(flowField);
          particleTexture.xyz += flowField * (FLOWFIELD_STRENGTH + (1.0 - uTransition) * 10.) * uDeltaTime;

          // Decay
          particleTexture.a += uDeltaTime;
        }

        gl_FragColor = mix(particleTexture, basePositionTexture, pow(uFrequency * 15., 3.0));
      }
    `

        this.gpgpu.particlesVariable = this.gpgpu.computation.addVariable('uParticles', this.shader, this.baseParticlesTexture)
        this.gpgpu.computation.setVariableDependencies(this.gpgpu.particlesVariable, [this.gpgpu.particlesVariable])

        // Uniforms
        this.gpgpu.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0.0)
        this.gpgpu.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0.0)
        this.gpgpu.particlesVariable.material.uniforms.uBasePositions = new THREE.Uniform(this.baseParticlesTexture)
        this.gpgpu.particlesVariable.material.uniforms.uTransition = new THREE.Uniform(0.0)
        this.gpgpu.particlesVariable.material.uniforms.uFrequency = new THREE.Uniform(0.0)
        this.gpgpu.computation.init()

        /* 
          Particles
        */
        this.particles = {}

        this.particlesUvArray = new Float32Array(this.baseGeometry.count * 2)
        this.randomArray = new Float32Array(this.baseGeometry.count)

        for (let y = 0; y < this.gpgpu.size; y++) {
            for (let x = 0; x < this.gpgpu.size; x++) {
                const i = y * this.gpgpu.size + x
                const i2 = i * 2

                const uvX = (x + 0.5) / this.gpgpu.size
                const uvY = (y + 0.5) / this.gpgpu.size

                this.particlesUvArray[i2 + 0] = uvX
                this.particlesUvArray[i2 + 1] = uvY

                this.randomArray[i] = Math.random()
            }
        }

        this.particles.geometry = new THREE.BufferGeometry()
        this.particles.geometry.setDrawRange(0, this.baseGeometry.count)
        this.particles.geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(this.particlesUvArray, 2))
        this.particles.geometry.setAttribute('aRandom', new THREE.BufferAttribute(this.randomArray, 1))
        this.particles.geometry.boundingSphere = new THREE.Sphere(
            new THREE.Vector3(0, 0, 0), // Center
            10 // Radius (big enough to contain all particles)
        )

        this.particles.material = new THREE.ShaderMaterial({
            transparent: true,
            // blending: THREE.AdditiveBlending,
            uniforms: {
                uSize: new THREE.Uniform(0.115), // 0.15 With size-attenuation
                uResolution: new THREE.Uniform(new THREE.Vector2(this.gl.sizes.width * this.gl.sizes.pixelRatio, this.gl.sizes.height * this.gl.sizes.pixelRatio)),
                uParticlesTexture: new THREE.Uniform(null),
                uProgress: new THREE.Uniform(1),
                uTransition: new THREE.Uniform(0.0),
                uCircleSize: new THREE.Uniform(0.025),
                uBokeh: new THREE.Uniform(0.0),
                uFocusDistance: new THREE.Uniform(7.5),
                uFocusRange: new THREE.Uniform(0.25),
                uCloseUpBokeh: new THREE.Uniform(0.0),

                COLOR_HIGHLIGHT: new THREE.Uniform(new THREE.Color(0xb2e0ff)),
            },
            vertexShader: /* glsl */ `
        uniform vec2 uResolution;
        uniform float uSize;
        uniform sampler2D uParticlesTexture;
        uniform float uProgress;
        uniform float uTransition;
        uniform float uFocusDistance;
        uniform float uFocusRange;
        uniform float uCloseUpBokeh;
        attribute vec2 aParticlesUv;
        attribute float aRandom;
        
        varying vec4 vColor;
        varying vec2 vParticlesUv;
        varying float vLifeSize;
        varying float vDepth;

        void main() {
          vec4 particle = texture2D(uParticlesTexture, aParticlesUv);
          particle.z += 15.0 * smoothstep(0.9, 1.0, aRandom) * smoothstep(0.0, 0.3, uProgress);
          // particle.y += particle.z * 0.2;
          // particle.x += particle.z * 0.2;

          // Final position
          vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;
          gl_Position = projectedPosition;

          // Life Size
          float lifeIn = smoothstep(0.0, 0.1, particle.a);
          float lifeOut = 1.0 - smoothstep(0.9, 1.0, particle.a);
          float lifeSize = min(lifeIn, lifeOut) * smoothstep(0.2, 1.0, uTransition);
      
          // Point size
          gl_PointSize = aRandom * lifeSize * uSize * uResolution.y;
          // gl_PointSize *= (1.0 / - viewPosition.z);
      
          // Varyings
          vColor = vec4(vec3(1.0), particle.a);
          vParticlesUv = aParticlesUv;
          vLifeSize = lifeSize;
          vDepth = pow(min(abs((uFocusDistance + viewPosition.z - uCloseUpBokeh * 5.0) * uFocusRange), 1.0), 2.0);
        }
      `,
            fragmentShader: /* glsl */ `
        varying vec4 vColor;
        varying vec2 vParticlesUv;
        varying float vLifeSize;
        varying float vDepth;

        uniform sampler2D uParticlesTexture;
        uniform float uCircleSize;
        uniform float uBokeh;
        uniform float uCloseUpBokeh;

        uniform float uTransition;
        uniform vec3 COLOR_HIGHLIGHT;

        void main() {
          vec4 particle = texture2D(uParticlesTexture, vParticlesUv);

          float distanceToCenter = length(gl_PointCoord - 0.5);
          if(distanceToCenter > 0.5) discard;

          float mask = 1.0 - distance(distanceToCenter, 0.25 / 8.0) * 8.0;
          mask = smoothstep(1.0 - uCircleSize - pow(uBokeh, 2.0) * 8.0 * vDepth, 1.0, mask);

          vec4 color = vec4(COLOR_HIGHLIGHT, max(mask, 0.25 * step(distanceToCenter, 0.25 / 8.0)) * vLifeSize);
          color.a -= (pow(uBokeh, 0.5) * (0.75 + vDepth * 0.25));
          color.a = max(color.a, 0.0);

          gl_FragColor = color;
        }
      `,
        })

        this.particles.material.depthWrite = false

        this.mesh = new THREE.Points(this.particles.geometry, this.particles.material)

        this.mesh.rotation.x = -Math.PI * 0.425
        this.mesh.position.set(0.114, 1.82, -0.48)
        this.mesh.renderOrder = 2

        this.instance.add(this.mesh)

        /* 
          Functions
        */
        // this.setProgress()
    }

    // setProgress(_progress) {
    //   // Default
    //   this.particles.material.uniforms.uProgress.value = 1
    // }

    triggerHover() {
        const tl = gsap.timeline({
            delay: 0.5,
        })

        tl.fromTo(
            this.mesh.scale, {
                x: 1,
                y: 1,
                z: 1,
            }, {
                x: 1.15,
                y: 1.15,
                z: 1.15,
                duration: 0.5,
                ease: 'power2.inOut',
            }
        )

        tl.fromTo(
            this.mesh.scale, {
                x: 1.15,
                y: 1.15,
                z: 1.15,
            }, {
                x: 1,
                y: 1,
                z: 1,
                duration: 2,
                ease: 'power2.inOut',
                immediateRender: false,
            }
        )
    }

    triggerWave(_direction, _duration, _ease, _animateStrength = false, _delay) {
        if (_direction === 1) {
            gsap.fromTo(
                this.mesh.scale, {
                    x: 0.1,
                    y: 0.1,
                    z: 0.1,
                }, {
                    x: 1,
                    y: 1,
                    z: 1,
                    delay: _delay ? _delay : 0,
                    duration: _duration != undefined ? _duration : 4.1,
                    ease: _ease ? _ease : 'power2.inOut',
                }
            )

            gsap.fromTo(
                this.particles.material.uniforms.uTransition, {
                    value: 0.0,
                }, {
                    value: 1.0,
                    duration: _duration != undefined ? _duration : 4.1,
                    ease: _ease ? _ease : 'power2.inOut',
                }
            )

            if (_animateStrength) {
                gsap.fromTo(
                    this.gpgpu.particlesVariable.material.uniforms.uTransition, {
                        value: 0.0,
                    }, {
                        value: 1.0,
                        duration: _duration != undefined ? _duration : 4.1,
                        ease: _ease ? _ease : 'power2.inOut',
                    }
                )
            }
        } else {
            gsap.fromTo(
                this.mesh.scale, {
                    x: 1,
                    y: 1,
                    z: 1,
                }, {
                    x: 0.1,
                    y: 0.1,
                    z: 0.1,
                    duration: _duration != undefined ? _duration : 2.75,
                    ease: 'expo.inOut',
                }
            )

            gsap.fromTo(
                this.particles.material.uniforms.uTransition, {
                    value: 1.0,
                }, {
                    value: 0,
                    duration: _duration != undefined ? _duration : 2.75,
                    ease: 'expo.inOut',
                }
            )

            if (_animateStrength) {
                gsap.fromTo(
                    this.gpgpu.particlesVariable.material.uniforms.uTransition, {
                        value: 1.0,
                    }, {
                        value: 0.0,
                        duration: _duration != undefined ? _duration : 2.75,
                        ease: 'expo.inOut',
                    }
                )
            }
        }
    }

    resize() {
        this.particles.material.uniforms.uResolution.value = new THREE.Vector2(this.gl.sizes.width * this.gl.sizes.pixelRatio, this.gl.sizes.height * this.gl.sizes.pixelRatio)
    }

    update() {
        this.gpgpu.particlesVariable.material.uniforms.uTime.value += (this.gl.time.delta * 0.0125 - this.gl.audio.frequencies.synthLoop.current * this.gl.time.delta * 0.0005) * (0.25 + this.globalSpeed * 0.75)
        this.gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = this.gl.time.delta * 0.001 * (0.25 + this.globalSpeed * 0.75)
        this.gpgpu.computation.compute()
        this.particles.material.uniforms.uParticlesTexture.value = this.gpgpu.computation.getCurrentRenderTarget(this.gpgpu.particlesVariable).texture

        /* 
          Rotation
        */
        this.mesh.rotation.z += this.gl.time.delta * 0.00075 * this.globalSpeed

        /* 
          Frequency
        */
        this.gpgpu.particlesVariable.material.uniforms.uFrequency.value = this.gl.audio.frequencies.synthLoop.current * 0.001
    }
}