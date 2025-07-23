import * as THREE from 'three'
import {
    OrbitControls
} from 'three/examples/jsm/controls/OrbitControls.js'
import {
    Scroll
} from '@/scroll'
import gsap, {
    ScrollTrigger
} from '@/gsap'
import ScrollController from '@/modules/ScrollController'

// import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
// import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
// import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
// import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
// import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

import Gl from '../../Gl'

import {
    CasePhysicalMaterial,
    EarphoneGlassMaterial,
    EarphoneBaseMaterial,
    CoreMaterial,
    BloomMaterial,
    GoldMaterial,
    TubeMaterial,
    TouchPadMaterial,
    SiliconeMaterial
} from '../../Utils/Materials'

import Circles from '../Geometry/Circles'
import Waves from '../Geometry/Waves'
import Particles from '../Geometry/Particles'

export default class SceneMain {
    constructor(_params) {
        /* 
          Params
        */
        this.params = _params

        /* 
          Setup
        */
        this.id = _params ? .id

        /* 
          Values
        */
        this.scrollProgress = 0
        this.idleIntensity = 0
        this.hoverAnimationPlaying = true
        this.hoverIntensityGlobal = 1
        this.hoverLIntensity = {
            current: 0,
            target: 0,
        }
        this.hoverRIntensity = {
            current: 0,
            target: 0,
        }
        this.hoverCameraIntensity = 0
        this.touchPadMouse = {
            current: new THREE.Vector2(0.0, 0.0),
            target: new THREE.Vector2(0.0, 0.0),
        }
        this.hoveredEarphone = null
        this.hoveredEarphoneDOM = null
        this.helpers = []
        this.hoverVector = new THREE.Vector3(0, 0, 0)

        /* 
          Flags
        */
        this.isRendering = false

        /* 
          Settings
        */
        this.settings = {
            camera: {
                cursorIntensity: {
                    position: 1,
                    rotation: 1,
                },
            },
            idle: {
                cursorIntensity: {
                    idle: 1,
                },
            },
        }

        /* 
          GL
        */
        this.gl = new Gl()

        /* 
          Scene
        */
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x133153)
        // this.scene.environment = this.gl.assets.hdris.base

        /* 
          Render Target
        */
        this.renderTarget = new THREE.WebGLRenderTarget(this.gl.sizes.width * this.gl.sizes.pixelRatio, this.gl.sizes.height * this.gl.sizes.pixelRatio, {
            samples: 1,
        })

        /* 
          Objects
        */
        this.circles = new Circles()
        this.scene.add(this.circles.instances)

        this.waves = new Waves()
        this.scene.add(this.waves.instance)

        this.particles = new Particles()
        this.scene.add(this.particles.instance)

        /* 
          Functions
        */
        this.setMaterials()
        this.setCamera()
        this.setModels()
        this.setLights()
        this.setAnimations()
        this.updateCameraAspect()
        this.setFovAnimation()
        this.setIdleAnimation()
        this.setEmissiveTransition()
        this.setHoverIntensity()
        this.setRaycaster()
        this.setFresnelTransition()
        this.setCaseTransition()
        this.createProjectedPoints()

        if (this.gl.isDebug) {
            this.setOrbitControls()
            this.setDebug()
        }
    }

    animateIn() {
        gsap.fromTo(
            this.caseModel.position, {
                y: this.modelsInitialParams.caseModel.position.y + 3,
            }, {
                y: this.modelsInitialParams.caseModel.position.y,
                ease: 'back.out(2)',
                // delay: 0.1,
                duration: 0.5,
                delay: 1.15,
            }
        )

        gsap.fromTo(
            this.camera.position, {
                y: -10,
            }, {
                y: 0,
                ease: 'expo.out',
                duration: 1,
                delay: 1.15,
            }
        )

        // gsap.fromTo(
        //   this.camera,
        //   {
        //     fov: 10,
        //   },
        //   {
        //     fov: this.cameraSettings.from,
        //     ease: 'expo.out',
        //     duration: 1,
        //     delay: 1.15,
        //     onUpdate: () => {
        //       this.camera.updateProjectionMatrix()
        //     },
        //   }
        // )
    }

    revealCase(_direction, _delay, _duration) {
        if (_direction == 1) {
            gsap.fromTo(
                this.coverTop.rotation, {
                    y: 0,
                }, {
                    y: -Math.PI * 0.475,
                    duration: _duration != undefined ? _duration : 1,
                    delay: _delay ? _delay : 0,
                    ease: 'expo.inOut',
                }
            )
        } else {
            gsap.fromTo(
                this.coverTop.rotation, {
                    y: -Math.PI * 0.475,
                }, {
                    y: 0,
                    duration: _duration != undefined ? _duration : 1,
                    delay: _delay ? _delay : 0,
                    ease: 'expo.inOut',
                }
            )
        }
    }

    setFovAnimation() {
        this.cameraSettings = {
            beginning: 32.3,
            mid: 21.9,
            zoom: 59.2,
        }
        this.camera.fov = this.cameraSettings.from
        this.camera.updateProjectionMatrix()
        /*
          Start
        */
        this.fovTimeline = gsap.timeline({
            paused: true,
        })
        this.fovTimeline.fromTo(
            this.camera, {
                fov: this.cameraSettings.beginning,
            }, {
                fov: this.cameraSettings.mid,
                ease: 'power2.inOut',
                duration: 1,
                onUpdate: () => {
                    this.camera.updateProjectionMatrix()
                },
            }
        )
        this.fovTimeline.fromTo(
            this.camera, {
                fov: this.cameraSettings.mid,
            }, {
                fov: this.cameraSettings.zoom,
                ease: 'power2.inOut',
                duration: 1,
                immediateRender: false,
                onUpdate: () => {
                    this.camera.updateProjectionMatrix()
                },
            },
            4
        )
    }

    setIdleAnimation() {
        /* 
          Start
        */
        this.idleTimeline = gsap.timeline({
            paused: true,
        })

        this.idleTimeline.fromTo(
            this, {
                idleIntensity: 0,
            }, {
                idleIntensity: 1,
                ease: 'power2.inOut',
                duration: 0.5,
            }
        )

        this.idleTimeline.fromTo(
            this, {
                idleIntensity: 1,
            }, {
                idleIntensity: 0,
                ease: 'power2.inOut',
                duration: 1,
                immediateRender: false,
            },
            4
        )
    }

    setEmissiveTransition() {
        /* 
          Start
        */
        this.emissiveTimeline = gsap.timeline({
            paused: true,
        })

        this.emissiveTimeline.fromTo(
            [this.materialEarphoneGlassL.uniforms.uEmissiveTransition, this.materialEarphoneGlassR.uniforms.uEmissiveTransition], {
                value: 0,
            }, {
                value: 1,
                ease: 'expo.inOut',
                duration: 1,
            },
            0.9
        )

        this.emissiveTimeline.fromTo(
            [this.materialEarphoneGlassL.uniforms.uEmissiveTransition, this.materialEarphoneGlassR.uniforms.uEmissiveTransition], {
                value: 1,
            }, {
                value: 0,
                ease: 'expo.inOut',
                duration: 0.5,
                immediateRender: false,
            },
            5
        )
    }

    setFresnelTransition() {
        /* 
          Start
        */
        this.fresnelTimeline = gsap.timeline({
            paused: true,
            duration: 1,
        })

        this.fresnelTimeline.fromTo(
            [this.materialEarphoneGlassL.uniforms.uFresnelTransition, this.materialEarphoneBaseL.uniforms.uFresnelTransition], {
                value: 0,
            }, {
                value: 1,
                ease: 'expo.inOut',
                duration: 0.5,
            },
            4.5
        )

        this.fresnelTimeline.fromTo(
            [this.materialEarphoneGlassL.uniforms.uFresnelTransition, this.materialEarphoneBaseL.uniforms.uFresnelTransition], {
                value: 1,
            }, {
                value: 0,
                ease: 'expo.inOut',
                duration: 1,
                immediateRender: false,
            },
            5.5
        )

        this.fresnelTimeline.to([this.materialEarphoneGlassL.uniforms.uFresnelTransition, this.materialEarphoneBaseL.uniforms.uFresnelTransition], {
            value: 0,
            duration: 5,
            immediateRender: false,
        })
    }

    setHoverIntensity() {
        this.hoverTimeline = gsap.timeline({
            paused: true,
        })

        this.hoverTimeline.fromTo(
            this, {
                hoverIntensityGlobal: 1,
            }, {
                hoverIntensityGlobal: 0,
            }
        )
    }

    setCaseTransition() {
        this.caseTransitionTimeline = gsap.timeline({
            paused: true,
        })

        this.caseTransitionTimeline.fromTo(
            [this.materialCover.uniforms.uFresnelTransition, this.materialCover.uniforms.uColorTransition], {
                value: 3,
            }, {
                value: 0,
                delay: 1,
                duration: 0.1,
                immediateRender: false,
            }
        )

        this.caseTransitionTimeline.fromTo(
            [this.materialCover.uniforms.uFresnelTransition, this.materialCover.uniforms.uColorTransition], {
                value: 0,
            }, {
                value: 0,
                duration: 1,
                immediateRender: false,
            }
        )
    }

    setOrbitControls() {
        // document.body.style.cssText += 'pointer-events: all!important;'
        // document.querySelector('body').style.pointerEvents = 'none'
        this.gl.canvas.style.pointerEvents = 'all'

        this.controls = new OrbitControls(this.debugCamera, this.gl.canvas)
        this.controls.enableDamping = true
        this.controls.enableZoom = false
    }

    setMaterials() {
        this.materialCover = CasePhysicalMaterial({
            map: this.gl.assets.textures.case.bottomDiffuse,
            aoMap: this.gl.assets.textures.case.alphaAo,
            // aoMapIntensity: 2.5,
            metalness: 0.75,
            roughness: 0,
            // envMap: this.gl.assets.hdris.base,
            // envMapIntensity: 5,
            // transparent: true,
            alphaMap: this.gl.assets.textures.case.alphaAo,
            emissiveMap: this.gl.assets.textures.case.emissive,
            emissiveIntensity: 1,
            emissive: 0xffffff,
            // visible: false,
        }, {})

        this.materialEarphoneGlassL = EarphoneGlassMaterial({
            // color: 0xff0000,
            metalness: 1,
            roughness: 0,
            // roughnessMap: this.gl.assets.textures.headphones.glassRoughness,
            // opacity: 0,
            // transparent: true,
            // envMap: this.gl.assets.hdris.base,
            // envMapIntensity: 2.5,
            emissive: 0xffffff,
            emissiveMap: this.gl.assets.textures.headphones.emissive,
            // alphaMap: this.gl.assets.textures.headphones.alpha,
            emissiveIntensity: 1.25,
            normalMap: this.gl.assets.textures.headphones.normal,
        }, {})

        this.materialEarphoneGlassR = EarphoneGlassMaterial({
            // color: 0xff0000,
            metalness: 1,
            roughness: 0,
            // roughnessMap: this.gl.assets.textures.headphones.glassRoughness,
            // opacity: 0,
            // transparent: true,
            // envMap: this.gl.assets.hdris.base,
            // envMapIntensity: 2.5,
            emissive: 0xffffff,
            emissiveMap: this.gl.assets.textures.headphones.emissive,
            // alphaMap: this.gl.assets.textures.headphones.alpha,
            emissiveIntensity: 1.25,
            normalMap: this.gl.assets.textures.headphones.normal,
        }, {})

        this.materialEarphoneBaseL = EarphoneBaseMaterial({
            map: this.gl.assets.textures.earphoneSilicone,
            aoMap: this.gl.assets.textures.headphones.roughnessAo,
            aoMapIntensity: 1.1,
            // metalness: 1,
            roughnessMap: this.gl.assets.textures.headphones.roughnessAo,
            // side: THREE.DoubleSide,
            // envMap: this.gl.assets.hdris.base,
            // envMapIntensity: 15,
            // iridescence: 4,
            emissive: 0xffffff,
            emissiveMap: this.gl.assets.textures.headphones.emissive,
            emissiveIntensity: 1,
        }, {})

        this.materialEarphoneBaseR = EarphoneBaseMaterial({
            map: this.gl.assets.textures.earphoneSilicone,
            aoMap: this.gl.assets.textures.headphones.roughnessAo,
            aoMapIntensity: 1.1,
            // metalness: 1,
            roughnessMap: this.gl.assets.textures.headphones.roughnessAo,
            // side: THREE.DoubleSide,
            // envMap: this.gl.assets.hdris.base,
            // envMapIntensity: 15,
            // iridescence: 4,
            emissive: 0xffffff,
            emissiveMap: this.gl.assets.textures.headphones.emissive,
            emissiveIntensity: 1,
        }, {})

        this.materialCore = CoreMaterial()

        this.materialSilicone = SiliconeMaterial()
        // this.materialSilicone = SiliconeMaterial(
        //   {
        //     map: this.gl.assets.textures.earphoneSilicone,
        //     // aoMap: this.gl.assets.textures.case.ao,
        //     // aoMapIntensity: 2.5,
        //     metalness: 1,
        //     roughness: 0,
        //     envMap: this.gl.assets.hdris.base,
        //     envMapIntensity: 5,
        //     // transparent: true,
        //     // alphaMap: this.gl.assets.textures.case.alpha,
        //     // emissiveMap: this.gl.assets.textures.case.emissive,
        //     // emissiveIntensity: 1,
        //     // emissive: 0xffffff,
        //     // visible: false,
        //   },
        //   {}
        // )
    }

    setModels() {
        /* 
          Case
        */
        this.caseModel = this.gl.assets.models.scene.scene.getObjectByName('case').clone()

        // this.caseModel = this.caseCopy.clone()
        // console.log(this.caseModel)

        this.scene.add(this.caseModel)

        /* 
          Tube
        */
        this.tube = this.gl.assets.models.scene.scene.getObjectByName('tube').clone()
        this.tube.material = TubeMaterial()

        this.tube.rotation.x = Math.PI * (0.5 - 0.425)
        this.tube.renderOrder = 0

        this.scene.add(this.tube)

        /* 
          Cover
        */
        this.coverTop = this.caseModel.getObjectByName('case-top')
        this.coverTop.material = this.materialCover

        this.coverTop.renderOrder = 1

        this.coverBottom = this.caseModel.getObjectByName('case-bottom')
        this.coverBottom.material = this.materialCover

        this.coverBottom.renderOrder = 1

        this.coverChild = this.caseModel.getObjectByName('case-child')
        this.animationCoverChild = this.createMixer(this.coverChild, 'animation.case.child')

        this.materialCover.uniforms.uPosition.value = this.coverChild.getWorldPosition(new THREE.Vector3())

        /* 
          Earphones
        */

        // Left
        this.earphoneL = this.caseModel.getObjectByName('earphone-l')
        this.animationEarphoneL = this.createMixer(this.earphoneL, 'animation.earphone.l')

        this.earphoneLRaycast = this.caseModel.getObjectByName('earphone-l-raycast')
        this.earphoneLRaycast.visible = false
        this.earphoneLRaycast.material = new THREE.MeshNormalMaterial({
            wireframe: true,
        })

        this.earphoneLInteractivity = this.caseModel.getObjectByName('earphone-l-interactivity')

        // this.test = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial())
        // this.earphoneL.add(this.test)

        this.earphoneLBase = this.caseModel.getObjectByName('earphone-l-base')
        this.earphoneLBase.material = this.materialEarphoneBaseL

        this.earphoneLGlass = this.caseModel.getObjectByName('earphone-l-glass')
        this.earphoneLGlass.material = this.materialEarphoneGlassL

        this.earphoneLIdle = this.caseModel.getObjectByName('earphone-l-idle')

        this.earphoneLChild = this.caseModel.getObjectByName('earphone-l-child')

        // Destructured Silicone
        this.earphoneSilicone = this.caseModel.getObjectByName('earphone-l-silicone')
        this.animationEarphoneSilicone = this.createMixer(this.earphoneSilicone, 'animation.earphone.silicone')
        this.earphoneSilicone.material = this.materialEarphoneBaseL

        this.earphoneCoreL = this.caseModel.getObjectByName('earphone-l-core')
        this.animationEarphoneCore = this.createMixer(this.earphoneCoreL, 'animation.earphone.core')
        this.earphoneCoreL.material = this.materialCore
        // this.earphoneCoreL.depthTest = false
        // this.earphoneCoreL.depthWrite = false
        // this.earphoneCoreL.renderOrder = 100
        // this.earphoneCoreL.layers.enable(this.bloom.layer.index)

        this.earphoneCoreLBloom = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), BloomMaterial())

        // this.earphoneCoreLBloom.material.depthTest = false
        // this.earphoneCoreLBloom.material.depthWrite = false
        // this.earphoneCoreLBloom.renderOrder = 100

        this.earphoneCoreL.add(this.earphoneCoreLBloom)

        this.earphoneCoreLBloomHelper = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshNormalMaterial({
                wireframe: true,
                side: THREE.DoubleSide,
            })
        )
        this.earphoneCoreLBloomHelper.visible = false
        this.earphoneCoreL.add(this.earphoneCoreLBloomHelper)

        this.earphoneRectangle = this.caseModel.getObjectByName('earphone-l-rectangle')
        // this.animationEarphoneRectangle = this.createMixer(this.earphoneRectangle, 'animation.earphone.rectangle')
        this.earphoneRectangle.material = this.materialEarphoneBaseL

        this.earphoneSpeaker = this.caseModel.getObjectByName('earphone-l-speaker')
        this.animationEarphoneSpeaker = this.createMixer(this.earphoneSpeaker, 'animation.earphone.speaker')
        this.earphoneSpeaker.material = this.materialEarphoneBaseR

        // Right
        this.earphoneR = this.caseModel.getObjectByName('earphone-r')
        this.animationEarphoneR = this.createMixer(this.earphoneR, 'animation.earphone.r')

        this.earphoneRRaycast = this.caseModel.getObjectByName('earphone-r-raycast')
        this.earphoneRRaycast.visible = false
        this.earphoneRRaycast.material = new THREE.MeshNormalMaterial({
            wireframe: true,
        })

        this.interactivityTargetRotation = new THREE.Vector3()

        this.earphoneRRaycastSpeaker = this.caseModel.getObjectByName('earphone-r-raycast-speaker')
        this.earphoneRRaycastSpeaker.visible = false
        this.earphoneRRaycastSpeaker.material = new THREE.MeshNormalMaterial({
            wireframe: true,
        })

        this.earphoneRRaycastVolumeUp = this.caseModel.getObjectByName('earphone-r-raycast-volume-up')
        this.earphoneRRaycastVolumeUp.visible = false
        this.earphoneRRaycastVolumeUp.material = new THREE.MeshNormalMaterial({
            wireframe: true,
        })

        this.earphoneRRaycastVolumeDown = this.caseModel.getObjectByName('earphone-r-raycast-volume-down')
        this.earphoneRRaycastVolumeDown.visible = false
        this.earphoneRRaycastVolumeDown.material = new THREE.MeshNormalMaterial({
            wireframe: true,
        })

        this.earphoneRRaycastMic = this.caseModel.getObjectByName('earphone-r-raycast-mic')
        this.earphoneRRaycastMic.visible = false
        this.earphoneRRaycastMic.material = new THREE.MeshNormalMaterial({
            wireframe: true,
        })

        this.earphoneRRaycastVolumeUpChildren = new THREE.Object3D()
        this.earphoneRRaycastVolumeUp.add(this.earphoneRRaycastVolumeUpChildren)

        this.earphoneRRaycastVolumeDownChildren = new THREE.Object3D()
        this.earphoneRRaycastVolumeDown.add(this.earphoneRRaycastVolumeDownChildren)

        this.earphoneRRaycastSpeakerChildren = new THREE.Object3D()
        this.earphoneRRaycastSpeaker.add(this.earphoneRRaycastSpeakerChildren)

        this.earphoneRRaycastMicChildren = new THREE.Object3D()
        this.earphoneRRaycastMic.add(this.earphoneRRaycastMicChildren)

        this.earphoneRInteractivity = this.caseModel.getObjectByName('earphone-r-interactivity')
        this.earphoneRInteractivityRotationCheck = new THREE.Vector3(0, 0, 0)

        this.earphoneRBase = this.caseModel.getObjectByName('earphone-r-base')
        this.earphoneRBase.material = this.materialEarphoneBaseR

        this.earphoneRGlass = this.caseModel.getObjectByName('earphone-r-glass')
        this.earphoneRGlass.material = this.materialEarphoneGlassR

        this.earphoneRIdle = this.caseModel.getObjectByName('earphone-r-idle')

        this.earphoneRChild = this.caseModel.getObjectByName('earphone-r-child')

        this.earphoneCoreR = this.caseModel.getObjectByName('earphone-r-core')
        this.earphoneCoreR.material = this.materialCore

        this.earphoneRVolume = this.caseModel.getObjectByName('earphone-r-volume')
        this.earphoneRVolume.material = this.materialEarphoneBaseR

        this.earphoneTouchPad = this.caseModel.getObjectByName('earphone-r-touch-pad')
        // this.earphoneTouchPad.depthWrite = false
        this.earphoneTouchPad.material = TouchPadMaterial()

        /* 
          Actions
        */
        this.actions = this.gl.assets.models.scene.scene.getObjectByName('actions')
        this.animationActions = this.createMixer(this.actions, 'animation.actions')
        this.actionsB = this.gl.assets.models.scene.scene.getObjectByName('actions-b')
        this.animationActionsB = this.createMixer(this.actionsB, 'animation.actions-b')

        /* 
          Projection
        */
        this.projectionEmptyHeartRate = this.caseModel.getObjectByName('projection-heart-rate')
        this.projectionEmptyMic = this.caseModel.getObjectByName('projection-mic')
        this.projectionEmptyMicHd = this.caseModel.getObjectByName('projection-mic-hd')
        this.projectionEmptyTouchPad = this.caseModel.getObjectByName('projection-touch-pad')
        this.projectionEmptyVolume = this.caseModel.getObjectByName('projection-volume')
        this.projectionEmptyIpx = this.caseModel.getObjectByName('projection-ipx')
        this.projectionEmptySpectrumVisualiser = this.caseModel.getObjectByName('projection-spectrum-visualiser')
        this.projectionEmptyEmissionCore = this.caseModel.getObjectByName('projection-emission-core')
        this.projectionEmptyChip = this.caseModel.getObjectByName('projection-chip')
        this.projectionEmptyDiffusionRotaryDiscs = this.caseModel.getObjectByName('projection-diffusion-rotaty-discs')
        this.projectionEmptyDampeningShell = this.caseModel.getObjectByName('projection-dampening-shell')

        /* 
          Initial Params
        */
        this.modelsInitialParams = {
            caseModel: {
                position: this.caseModel.position.clone(),
            },
            earphoneLIdle: {
                position: this.earphoneLIdle.position.clone(),
                rotation: this.earphoneLIdle.rotation.clone(),
            },
            earphoneRIdle: {
                position: this.earphoneRIdle.position.clone(),
                rotation: this.earphoneRIdle.rotation.clone(),
            },
            earphoneSilicone: {
                position: this.earphoneSilicone.position.clone(),
            },
            earphoneCore: {
                position: this.earphoneCoreL.position.clone(),
            },
            earphoneRectangle: {
                position: this.earphoneRectangle.position.clone(),
            },
            earphoneSpeaker: {
                position: this.earphoneSpeaker.position.clone(),
            },
            earphoneVolume: {
                position: this.earphoneRVolume.position.clone(),
                rotation: this.earphoneRVolume.rotation.clone(),
            },
        }
    }

    setLights() {
        /* 
          Light Camera
        */
        this.lightCamera = this.gl.assets.models.scene.scene.getObjectByName('light-camera').clone()
        this.animationLightCamera = this.createMixer(this.lightCamera, 'animation.light.camera')
        this.lightCamera.scale.set(1, 1, 1)
        this.lightCamera.intensity = 2000
        this.lightCamera.decay = 2

        this.scene.add(this.lightCamera)

        if (this.gl.isDebug) {
            this.lightCameraHelper = new THREE.PointLightHelper(this.lightCamera, 1, 0xffff00)
            this.lightCameraHelper.visible = false
            this.scene.add(this.lightCameraHelper)

            this.helpers.push(this.lightCameraHelper)
        }

        // this.testLight = new THREE.PointLight(0xffff00, 100, 1000, 2)
        // this.testLight.position.set(0, 10, 0)
        // this.scene.add(this.testLight)

        // console.log(this.testLight)

        /* 
          Light Earphone L
        */
        this.lightEarphoneL = this.caseModel.getObjectByName('light-earphone-l')
        this.lightEarphoneL.scale.set(1, 1, 1)
        this.lightEarphoneL.intensity = 100
        this.lightEarphoneL.decay = 10

        // this.scene.add(this.lightEarphoneL)

        if (this.gl.isDebug) {
            this.lightEarphoneLHelper = new THREE.PointLightHelper(this.lightEarphoneL, 1, 0xffff00)
            this.lightEarphoneLHelper.visible = false
            this.scene.add(this.lightEarphoneLHelper)

            this.helpers.push(this.lightEarphoneLHelper)
        }
    }

    setCamera() {
        /* 
          Camera
        */
        this.cameraWrapper = this.gl.assets.models.scene.scene.getObjectByName('camera-wrapper').clone()
        this.scene.add(this.cameraWrapper)

        this.camera = this.cameraWrapper.children[0].clone()
        this.cameraWrapper.add(this.camera)
        this.cameraDirection = new THREE.Vector3()

        // this.activeCamera = this.camera

        this.animationCamera = this.createMixer(this.cameraWrapper, 'animation.camera')

        this.cameraTarget = this.gl.assets.models.scene.scene.getObjectByName('target').clone()
        this.animationCameraTarget = this.createMixer(this.cameraTarget, 'animation.target.camera')

        this.cameraFov = this.gl.assets.models.scene.scene.getObjectByName('fov').clone()
        this.animationCameraFov = this.createMixer(this.cameraFov, 'animation.camera.fov')
        this.scene.add(this.cameraFov)

        /* 
          Easter Egg Camera
        */
        this.easterEggCamera = new THREE.PerspectiveCamera(60, this.gl.sizes.width / this.gl.sizes.height, 0.1, 100)
        this.easterEggCameraPosition = new THREE.Vector3(0.5, 3, 10)
        this.easterEggCameraTarget = new THREE.Vector3(1.5, 3, 0)
        this.scene.add(this.easterEggCamera)

        /* 
          Debug Camera
        */
        this.debugCamera = new THREE.PerspectiveCamera(80, this.gl.sizes.width / this.gl.sizes.height, 0.1, 100)
        this.debugCamera.position.copy(this.cameraWrapper.position)

        /* 
          Set Active Camera
        */
        this.activeCamera = this.params ? .camera == 'easter-egg' ? this.easterEggCamera : this.camera

        /* 
          Set Debug
        */

        if (this.gl.isDebug) {
            this.cameraTargetHelper = new THREE.AxesHelper(1)
            this.cameraTargetHelper.visible = false
            this.scene.add(this.cameraTargetHelper)

            this.helpers.push(this.cameraTargetHelper)

            this.cameraHelper = new THREE.CameraHelper(this.camera)
            this.cameraHelper.visible = false
            this.scene.add(this.cameraHelper)

            this.helpers.push(this.cameraHelper)
        }
    }

    createProjectedPoints() {
        this.projectedEmpties = [
            // A
            this.projectionEmptySpectrumVisualiser,
            this.projectionEmptyIpx,

            // B
            this.projectionEmptyHeartRate,
            this.projectionEmptyMicHd,

            // C
            this.projectionEmptyMic,
            this.projectionEmptyTouchPad,
            this.projectionEmptyVolume,

            // E
            this.projectionEmptyChip,
            this.projectionEmptyDampeningShell,

            // F
            this.projectionEmptyDiffusionRotaryDiscs,
            this.projectionEmptyEmissionCore,
        ]
    }

    // setCameraTarget() {
    //   this.cameraTarget = this.gl.assets.models.scene.scene.getObjectByName('target').clone()
    //   this.scene.add(this.cameraTarget)

    //   if (this.gl.isDebug) {
    //     this.cameraTargetHelper = new THREE.AxesHelper(1)
    //     this.scene.add(this.cameraTargetHelper)
    //   }

    //   /*
    //     Animation
    //   */
    //   // this.animationCameraTarget = this.createMixer(this.cameraTarget, 'animation.target')
    // }

    createMixer(_object, _animationName) {
        const mixer = new THREE.AnimationMixer(_object)
        const clip = THREE.AnimationClip.findByName(this.gl.assets.models.scene.animations, _animationName)
        const action = mixer.clipAction(clip)
        // action.clampWhenFinished = true
        // action.loop = THREE.LoopOnce
        action.play()

        return {
            mixer: mixer,
            clip: clip,
        }
    }

    setAnimations() {
        this.animations = []

        this.animations.push({
            mixer: this.animationCoverChild.mixer,
            clip: this.animationCoverChild.clip,
        })

        this.animations.push({
            mixer: this.animationCamera.mixer,
            clip: this.animationCamera.clip,
        })

        this.animations.push({
            mixer: this.animationCameraTarget.mixer,
            clip: this.animationCameraTarget.clip,
        })

        this.animations.push({
            mixer: this.animationCameraFov.mixer,
            clip: this.animationCameraFov.clip,
        })

        this.animations.push({
            mixer: this.animationLightCamera.mixer,
            clip: this.animationLightCamera.clip,
        })

        this.animations.push({
            mixer: this.animationEarphoneL.mixer,
            clip: this.animationEarphoneL.clip,
        })

        this.animations.push({
            mixer: this.animationEarphoneR.mixer,
            clip: this.animationEarphoneR.clip,
        })

        this.animations.push({
            mixer: this.animationActions.mixer,
            clip: this.animationActions.clip,
        })

        this.animations.push({
            mixer: this.animationActionsB.mixer,
            clip: this.animationActionsB.clip,
        })

        this.animations.push({
            mixer: this.animationEarphoneSilicone.mixer,
            clip: this.animationEarphoneSilicone.clip,
        })

        this.animations.push({
            mixer: this.animationEarphoneCore.mixer,
            clip: this.animationEarphoneCore.clip,
        })

        this.animations.push({
            mixer: this.animationEarphoneSpeaker.mixer,
            clip: this.animationEarphoneSpeaker.clip,
        })
    }

    triggerHover() {
        const tlCaseModel = gsap.timeline({
            // delay: 0.1,
        })

        tlCaseModel.to(this.caseModel.position, {
            y: this.modelsInitialParams.caseModel.position.y - 0.4,
            // delay: 0.05,
            duration: 0.25,
            ease: 'power2.inOut',
        })

        tlCaseModel.to(this.caseModel.position, {
            y: this.modelsInitialParams.caseModel.position.y,
            duration: 0.5,
            ease: 'power2.inOut',
            immediateRender: false,
        })

        // const tlCamera = gsap.timeline()

        // tlCamera.to(this.camera, {
        //   fov: this.cameraSettings.from + 5,
        //   duration: 0.5,
        //   ease: 'power2.inOut',
        //   onUpdate: () => {
        //     this.camera.updateProjectionMatrix()
        //   },
        // })

        // tlCamera.to(this.camera, {
        //   fov: this.cameraSettings.from,
        //   duration: 0.5,
        //   ease: 'power2.inOut',
        //   immediateRender: false,
        //   onUpdate: () => {
        //     this.camera.updateProjectionMatrix()
        //   },
        // })
    }

    updateCameraAspect() {
        // Camera
        this.camera.aspect = this.gl.sizes.width / this.gl.sizes.height
        this.camera.updateProjectionMatrix()

        this.easterEggCamera.aspect = this.gl.sizes.width / this.gl.sizes.height
        this.easterEggCamera.updateProjectionMatrix()

        this.debugCamera.aspect = this.gl.sizes.width / this.gl.sizes.height
        this.debugCamera.updateProjectionMatrix()
    }

    updateScroll(_progress) {
        const progress = this.params ? .fixedProgress ? this.params.fixedProgress : _progress

        // console.log(progress)

        /* 
          Update Mixers
        */
        this.animations.forEach((_mixer) => {
            _mixer.mixer.setTime(progress * _mixer.clip.duration * 0.9999) // 0.999 to prevent looping
        })

        // this.camera.getWorldDirection(this.cameraDirection)

        /* 
          Update Particles
        */
        // this.particles.setProgress(0.99)

        /* 
          Update Timelines
         */
        this.idleTimeline.progress(progress)
        this.emissiveTimeline.progress(progress)
        this.hoverTimeline.progress(Math.max(Math.min((-0.01 + progress) * 100, 1), 0))
        this.caseTransitionTimeline.progress(progress)
        // this.fresnelTimeline.progress(progress)
        // this.fovTimeline.progress(progress)

        /* 
          Update Camera Fov
        */
        this.camera.fov = this.focalLengthToVerticalFOV(this.cameraFov.position.x, 21.25)
        this.camera.updateProjectionMatrix()
        // console.log(this.camera.fov)

        /* 
          Update Actions
        */
        this.actionA = Math.ceil(Math.abs(this.actions.position.y))
        this.actionAClass = Math.floor(Math.abs(this.actions.position.y))
        this.actionB = Math.ceil(Math.abs(this.actions.position.z))
        this.actionBClass = Math.floor(Math.abs(this.actions.position.z))
        this.actionC = Math.ceil(Math.abs(this.actions.position.x))
        this.actionCClass = Math.floor(Math.abs(this.actions.position.x))
        this.actionE = Math.ceil(Math.abs(this.actionsB.scale.x))
        this.actionEClass = Math.floor(Math.abs(this.actionsB.scale.x))
        this.actionF = Math.ceil(Math.abs(this.actionsB.scale.z))
        this.actionFClass = Math.floor(Math.abs(this.actionsB.scale.z))
        this.actionD = Math.abs(this.actions.scale.x)
        this.actionFresnel = Math.abs(this.actions.scale.z)
        this.actionDepthOfField = Math.abs(this.actions.scale.y)
        this.actionTouchPad = Math.ceil(Math.abs(this.actionsB.position.x))
        this.actionCameraMobileShift = Math.abs(this.actionsB.position.y)
        this.actionAudio = Math.abs(this.actionsB.position.z)
        this.actionPowerLoop = Math.abs(this.actionsB.scale.y)

        /* 
          Update Projected Points
        */
        if (this.gl.world && !this.gl.world.isTransitioning) {
            if (this.actionAClass != this.previousActionA) {
                if (this.actionAClass) {
                    this.gl.world.projectedPointsDOMs[0].dom.classList.add('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[1].dom.classList.add('gl__projected-point--active')
                } else {
                    this.gl.world.projectedPointsDOMs[0].dom.classList.remove('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[1].dom.classList.remove('gl__projected-point--active')
                }
            }

            if (this.actionBClass != this.previousActionB) {
                if (this.actionBClass) {
                    this.gl.world.projectedPointsDOMs[2].dom.classList.add('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[3].dom.classList.add('gl__projected-point--active')
                } else {
                    this.gl.world.projectedPointsDOMs[2].dom.classList.remove('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[3].dom.classList.remove('gl__projected-point--active')
                }
            }

            if (this.actionCClass != this.previousActionC) {
                if (this.actionCClass) {
                    this.gl.world.projectedPointsDOMs[4].dom.classList.add('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[5].dom.classList.add('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[6].dom.classList.add('gl__projected-point--active')
                } else {
                    this.gl.world.projectedPointsDOMs[4].dom.classList.remove('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[5].dom.classList.remove('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[6].dom.classList.remove('gl__projected-point--active')

                    this.triggerSpeakerHover(-1)
                    this.triggerVolumeHover(-1)
                }
            }

            if (this.actionEClass != this.previousActionE) {
                if (this.actionEClass) {
                    this.gl.world.projectedPointsDOMs[7].dom.classList.add('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[9].dom.classList.add('gl__projected-point--active')
                } else {
                    this.gl.world.projectedPointsDOMs[7].dom.classList.remove('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[9].dom.classList.remove('gl__projected-point--active')
                }
            }

            if (this.actionFClass != this.previousActionF) {
                if (this.actionFClass) {
                    this.gl.world.projectedPointsDOMs[8].dom.classList.add('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[10].dom.classList.add('gl__projected-point--active')
                } else {
                    this.gl.world.projectedPointsDOMs[8].dom.classList.remove('gl__projected-point--active')
                    this.gl.world.projectedPointsDOMs[10].dom.classList.remove('gl__projected-point--active')
                }
            }
        }

        this.previousActionA = this.actionAClass
        this.previousActionB = this.actionBClass
        this.previousActionC = this.actionCClass
        this.previousActionE = this.actionEClass
        this.previousActionF = this.actionFClass
        this.previousActionTouchPad = this.actionTouchPad

        /* 
          Update Fresnel
        */
        this.materialEarphoneGlassR.uniforms.uFresnelTransition.value = this.actionFresnel
        this.materialEarphoneBaseR.uniforms.uFresnelTransition.value = this.actionFresnel
        this.materialEarphoneGlassL.uniforms.uFresnelTransition.value = this.actionFresnel
        this.materialEarphoneBaseL.uniforms.uFresnelTransition.value = this.actionFresnel

        /* 
          Update Depth of Field
        */
        this.particles.particles.material.uniforms.uBokeh.value = this.actionDepthOfField * 0.9
        this.particles.particles.material.uniforms.uCloseUpBokeh.value = Math.abs(this.actions.position.x)
        this.tube.material.uniforms.uBokeh.value = this.actionDepthOfField * 0.075

        /* 
          Update Bloom
        */
        this.earphoneCoreLBloom.material.uniforms.uOpacity.value = this.actionD

        /* 
          Update Touch Pad
        */
        // this.earphoneTouchPad.material.uniforms.uReveal.value = Math.abs(this.actionsB.position.x)
    }

    focalLengthToVerticalFOV(focalLength, sensorHeight = 24) {
        return 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI)
    }

    setRaycaster() {
        this.raycaster = new THREE.Raycaster()
    }

    setDebug() {
        this.normalHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 0.5, 0x00ff00)
        this.normalHelper.visible = false
        this.scene.add(this.normalHelper)

        this.helpers.push(this.normalHelper)

        this.cameraDirectionHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 3, 0xff0000)
        this.cameraDirectionHelper.visible = false
        this.scene.add(this.cameraDirectionHelper)

        this.helpers.push(this.cameraDirectionHelper)
    }

    resize() {
        this.particles.resize()

        this.renderTarget.setSize(this.gl.sizes.width * this.gl.sizes.pixelRatio, this.gl.sizes.height * this.gl.sizes.pixelRatio)

        this.updateCameraAspect()
    }

    setPostProcessing() {
        // Bloom Setup
        this.bloom = {
            layer: {
                instance: new THREE.Layers(),
                index: 99,
            },
            materials: {
                savedForRestore: {},
                dark: new THREE.MeshBasicMaterial({
                    color: 0x000000
                }),
            },
        }

        this.bloom.layer.instance.set(this.bloom.layer.index)

        // Passes
        this.renderScene = new RenderPass(this.scene, this.activeCamera)

        this.bloomPass = new UnrealBloomPass()
        this.bloomPass.strength = 1.5
        this.bloomPass.radius = 0.75

        this.bloomComposer = new EffectComposer(this.gl.renderer.instance)
        this.bloomComposer.setSize(this.gl.sizes.width / 4, this.gl.sizes.height / 4)
        this.bloomComposer.addPass(this.renderScene)
        this.bloomComposer.addPass(this.bloomPass)
        this.bloomComposer.renderToScreen = false

        this.mixPass = new ShaderPass(
            new THREE.ShaderMaterial({
                uniforms: {
                    baseTexture: new THREE.Uniform(null),
                    bloomTexture: new THREE.Uniform(this.bloomComposer.renderTarget2.texture),
                },
                vertexShader: /* glsl */ `
          varying vec2 vUv;

          void main()
          {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          
            vUv = uv;
          }
        `,
                fragmentShader: /* glsl */ `
          varying vec2 vUv;

          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          
          void main() {
            float intensity = 0.25;
          
            vec4 textureBase = texture2D(baseTexture, vUv);
            vec4 textureBloom = texture2D(bloomTexture, vUv);
          
            // vec4 backgroundColor = vec4(1.0, 0.0, 0.0, textureBase.a);
          
            gl_FragColor = textureBase + vec4(intensity) * textureBloom ;
            // gl_FragColor = textureBloom;
          }
        `,
            }),
            'baseTexture'
        )

        this.finalComposer = new EffectComposer(this.gl.renderer.instance, this.renderTarget)
        this.finalComposer.addPass(this.renderScene)
        this.finalComposer.addPass(this.mixPass)

        this.outputPass = new OutputPass()

        this.finalComposer.addPass(this.outputPass)
    }

    setNonBloomedMaterial(_obj) {
        if ((_obj.isMesh || _obj.isPoints || _obj.isObject3D) && !this.bloom.layer.instance.test(_obj.layers)) {
            this.bloom.materials.savedForRestore[_obj.uuid] = _obj.material
            _obj.material = this.bloom.materials.dark
        }
    }

    restoreMaterial(_obj) {
        if ((_obj.isMesh || _obj.isPoints || _obj.isObject3D) && !this.bloom.layer.instance.test(_obj.layers)) {
            _obj.material = this.bloom.materials.savedForRestore[_obj.uuid]
            delete this.bloom.materials.savedForRestore[_obj.uuid]
        }
    }

    renderPipeline() {
        if (!this.isRendering) return

        this.gl.renderer.instance.setRenderTarget(this.renderTarget)
        this.gl.renderer.instance.render(this.scene, this.activeCamera)

        // if (this.isBloomEnabled) {
        //   this.scene.traverse(this.setNonBloomedMaterial.bind(this))
        //   this.scene.background = new THREE.Color(0x000000)

        //   this.bloomComposer.render()

        //   this.scene.traverse(this.restoreMaterial.bind(this))
        //   this.scene.background = new THREE.Color(0x133153)
        // }

        // this.finalComposer.render()
    }

    updateCamera() {
        // Shift camera to right on mobile to better see the gold part
        if (this.gl.sizes.width < 768 && this.actionCameraMobileShift > 0) {
            this.camera.filmOffset = this.actionCameraMobileShift
        } else {
            this.camera.filmOffset = 0
        }

        /* 
          Camera
        */
        // this.cameraTarget.lookAt(this.cameraWrapper.position)
        if (this.id == 'easter-egg') {
            this.easterEggCamera.lookAt(this.easterEggCameraTarget)

            if (this.gl.sizes.width > 768) {
                this.easterEggCamera.position.x = this.easterEggCameraPosition.x + this.gl.world.mouse.eased.camera.value.x * this.settings.camera.cursorIntensity.rotation
                this.easterEggCamera.position.y = this.easterEggCameraPosition.y + this.gl.world.mouse.eased.camera.value.y * this.settings.camera.cursorIntensity.rotation
                this.easterEggCamera.position.z = this.easterEggCameraPosition.z

                this.easterEggCamera.rotation.x += this.gl.world.mouse.eased.camera.value.y * 0.05 * this.settings.camera.cursorIntensity.position
                this.easterEggCamera.rotation.y -= this.gl.world.mouse.eased.camera.value.x * 0.05 * this.settings.camera.cursorIntensity.position
                this.easterEggCamera.rotation.z = -this.gl.world.mouse.eased.camera.value.y * this.gl.world.mouse.eased.camera.value.x * 0.1 * this.settings.camera.cursorIntensity.position
            } else {
                this.easterEggCamera.position.x = this.easterEggCameraPosition.x
                this.easterEggCamera.position.y = this.easterEggCameraPosition.y
                this.easterEggCamera.position.z = this.easterEggCameraPosition.z

                this.easterEggCamera.rotation.x = 0
                this.easterEggCamera.rotation.y = 0
                this.easterEggCamera.rotation.z = 0
            }
        } else {
            this.camera.lookAt(this.cameraTarget.position)

            if (this.gl.sizes.width > 768) {
                this.camera.position.x = -this.gl.world.mouse.eased.camera.value.x * this.settings.camera.cursorIntensity.rotation // * this.actionDepthOfField
                this.camera.position.z = this.gl.world.mouse.eased.camera.value.y * this.settings.camera.cursorIntensity.rotation // * this.actionDepthOfField

                this.camera.rotation.x += this.gl.world.mouse.eased.camera.value.y * 0.05 * this.settings.camera.cursorIntensity.position // * this.actionDepthOfField
                this.camera.rotation.y -= this.gl.world.mouse.eased.camera.value.x * 0.05 * this.settings.camera.cursorIntensity.position // * this.actionDepthOfField
                this.camera.rotation.z = -this.gl.world.mouse.eased.camera.value.y * this.gl.world.mouse.eased.camera.value.x * 0.25 * this.settings.camera.cursorIntensity.position // * this.actionDepthOfField
            } else {
                this.camera.rotation.z = 0
            }
        }

        if (this.gl.isDebug) {
            this.cameraTargetHelper.position.copy(this.cameraTarget.position)

            this.controls.target.copy(this.cameraTarget.position)
            this.controls.update()

            this.cameraHelper.update()

            this.cameraDirectionHelper.position.copy(this.cameraWrapper.position)
            this.cameraDirectionHelper.setDirection(this.cameraDirection)
        }
    }

    updateLights() {
        /* 
          Lights
        */
        if (this.gl.isDebug) {
            this.lightCameraHelper.update()
            this.lightEarphoneLHelper.update()
        }
    }

    updateInteractivity() {
        const interactivityRotation = this.interactivityTargetRotation.clone()
        this.earphoneRInteractivityRotationCheck.copy(this.earphoneRInteractivity.rotation)

        if (this.actions.position.x > 0 || this.earphoneRInteractivityRotationCheck.length() > 0.01 || interactivityRotation.length() > 0.01) {
            this.earphoneRInteractivity.rotation.x = THREE.MathUtils.damp(this.earphoneRInteractivity.rotation.x, interactivityRotation.x, 0.01, this.gl.time.delta)
            this.earphoneRInteractivity.rotation.y = THREE.MathUtils.damp(this.earphoneRInteractivity.rotation.y, interactivityRotation.y, 0.01, this.gl.time.delta)
            this.earphoneRInteractivity.rotation.z = THREE.MathUtils.damp(this.earphoneRInteractivity.rotation.z, interactivityRotation.z, 0.01, this.gl.time.delta)
        }
    }

    updateBloom() {
        if (this.actionD > 0) {
            this.earphoneCoreLBloom.lookAt(this.cameraWrapper.position)
            this.earphoneCoreLBloom.rotateZ(-Math.PI * 0.125)
            this.earphoneCoreL.lookAt(this.cameraWrapper.position)
            this.earphoneCoreL.rotateZ(-Math.PI * 0.125)
        }
    }

    updateIdle() {
        if (this.hoverLIntensity.current > 0) {
            this.earphoneLIdle.position.y = THREE.MathUtils.lerp(this.modelsInitialParams.earphoneLIdle.position.y, this.modelsInitialParams.earphoneLIdle.position.y + 1.05, this.hoverLIntensity.current * this.hoverIntensityGlobal) // Hover on beginning
        } else {
            this.earphoneLIdle.position.y = this.modelsInitialParams.earphoneLIdle.position.y
        }

        if (this.hoverRIntensity.current > 0) {
            this.earphoneRIdle.position.y = THREE.MathUtils.lerp(this.modelsInitialParams.earphoneRIdle.position.y, this.modelsInitialParams.earphoneRIdle.position.y + 1.05, this.hoverRIntensity.current * this.hoverIntensityGlobal) // Hover on beginning
        } else {
            this.earphoneRIdle.position.y = this.modelsInitialParams.earphoneRIdle.position.y
        }

        if (this.idleIntensity > 0) {
            if (this.id == 'easter-egg') {
                this.earphoneLIdle.position.y += Math.sin(10 + this.gl.time.elapsed) * 0.1 * this.idleIntensity * this.settings.idle.cursorIntensity.idle // Idle movement
                this.earphoneRIdle.position.y += Math.sin(this.gl.time.elapsed * 0.75) * 0.1 * this.idleIntensity * this.settings.idle.cursorIntensity.idle // Idle movement
            } else {
                this.earphoneLIdle.position.y += Math.sin(10 + this.gl.time.elapsed) * 0.05 * this.idleIntensity * this.settings.idle.cursorIntensity.idle // Idle movement
                this.earphoneRIdle.position.y += Math.sin(this.gl.time.elapsed * 0.75) * 0.05 * this.idleIntensity * this.settings.idle.cursorIntensity.idle // Idle movement
            }
        }
    }

    updateTube() {
        this.tube.rotation.y = -this.gl.time.elapsed * 0.15
    }

    updateProjectedPoints() {
        if (this.gl.world.isTransitioning) return

        let worldPosition = new THREE.Vector3()
        let projected = new THREE.Vector3()

        if (this.actionA) {
            this.projectedEmpties[0].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[0].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`

            this.projectedEmpties[1].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[1].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`
        }

        if (this.actionB) {
            this.projectedEmpties[2].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[2].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`

            this.projectedEmpties[3].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[3].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`
        }

        if (this.actionC) {
            this.projectedEmpties[4].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[4].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`

            this.projectedEmpties[5].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[5].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`

            this.projectedEmpties[6].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[6].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`
        }

        if (this.actionE) {
            this.projectedEmpties[7].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[7].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`

            this.projectedEmpties[9].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[9].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`
        }

        if (this.actionF) {
            this.projectedEmpties[8].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[8].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`

            this.projectedEmpties[10].getWorldPosition(worldPosition)
            projected = worldPosition.project(this.activeCamera)
            this.gl.world.projectedPointsDOMs[10].dom.style.transform = `translate(${projected.x * (this.gl.sizes.width / 2)}px, ${-projected.y * (this.gl.sizes.height / 2)}px)`
        }
    }

    updateHover() {
        if (!this.gl.mouse.isMouseMoved) return

        /* 
          Raycaster
        */
        this.raycaster.setFromCamera(this.gl.mouse.normalized.current, this.activeCamera)

        if (Scroll.progress < 0.1 && !ScrollController.isTransitioning) {
            // Hover on beginning
            this.intersectedObjects = this.raycaster.intersectObjects([this.earphoneLRaycast, this.earphoneRRaycast])

            if (this.intersectedObjects.length > 0) {
                this.isHovering = true

                if (this.intersectedObjects[0].object.name == 'earphone-l-raycast') this.hoveredEarphone = 'earphone-l'
                if (this.intersectedObjects[0].object.name == 'earphone-r-raycast') this.hoveredEarphone = 'earphone-r'
            } else {
                this.isHovering = false
            }

            /* 
              Hover Trigger Global
            */
            if (this.isHovering != this.previousHover) {
                if (this.isHovering) {
                    // Start hover

                    // Reduce intensity of fluid distortion
                    this.gl.world.setHoverIntensity(-1)
                } else {
                    // End hover

                    // Reset intensity of fluid distortion
                    this.gl.world.setHoverIntensity(1)

                    // Reset hovered earphone
                    this.hoveredEarphone = null

                    if (!this.waves.isAnimating && (this.hoverLIntensity.current > 0.75 || this.hoverRIntensity.current > 0.75) && this.hoverIntensityGlobal) {
                        // Hover only when one of the earphones was above 0.75
                        this.triggerHover()
                        this.particles.triggerHover()
                        this.waves.triggerWave({
                            direction: 1,
                            duration: 1.75,
                            intensity: 0.5,
                            // delay: 0.1,
                            lightIntensity: 0,
                            ease: 'power1.out',
                        })
                    }
                }
            }

            /* 
              Earphone
            */
            if (this.hoveredEarphone != this.previousHoveredEarphone) {
                if (this.hoveredEarphone == 'earphone-l') {
                    this.hoverLIntensity.target = this.waves.isAnimating ? 0.25 : 1 // 0.25 is a slight hover when the animation is playing
                    this.hoverRIntensity.target = 0
                } else if (this.hoveredEarphone == 'earphone-r') {
                    this.hoverRIntensity.target = this.waves.isAnimating ? 0.25 : 1 // 0.25 is a slight hover when the animation is playing+
                    this.hoverLIntensity.target = 0
                } else {
                    this.hoverLIntensity.target = 0
                    this.hoverRIntensity.target = 0
                }
            }

            //

            if (this.hoverLIntensity.target > 0.01 || this.hoverLIntensity.current > 0.01) {
                this.hoverLIntensity.current = THREE.MathUtils.damp(this.hoverLIntensity.current, this.hoverLIntensity.target, 0.05, this.gl.time.delta)
            }
            if (this.hoverRIntensity.target > 0.01 || this.hoverRIntensity.current > 0.01) {
                this.hoverRIntensity.current = THREE.MathUtils.damp(this.hoverRIntensity.current, this.hoverRIntensity.target, 0.05, this.gl.time.delta)
            }

            const hoverCameraIntensityTarget = Math.max(this.hoverLIntensity.current, this.hoverRIntensity.current)

            if (hoverCameraIntensityTarget > 0.01) {
                this.hoverCameraIntensity = THREE.MathUtils.damp(this.hoverCameraIntensity, hoverCameraIntensityTarget * this.hoverIntensityGlobal, 0.05, this.gl.time.delta)
            }

            this.materialEarphoneGlassL.uniforms.uEmissiveHover.value = this.hoverLIntensity.current * this.hoverIntensityGlobal
            this.materialEarphoneGlassR.uniforms.uEmissiveHover.value = this.hoverRIntensity.current * this.hoverIntensityGlobal

            if (this.hoverLIntensity.current > 0.01) {
                this.earphoneLIdle.rotation.x = THREE.MathUtils.lerp(this.modelsInitialParams.earphoneLIdle.rotation.x, this.modelsInitialParams.earphoneLIdle.rotation.x + Math.PI / 20, this.hoverLIntensity.current * this.hoverIntensityGlobal) // Hover on beginning
                this.earphoneLIdle.rotation.y = THREE.MathUtils.lerp(this.modelsInitialParams.earphoneLIdle.rotation.y, this.modelsInitialParams.earphoneLIdle.rotation.y + Math.PI / 20, this.hoverLIntensity.current * this.hoverIntensityGlobal) // Hover on beginning
                this.earphoneLIdle.rotation.z = THREE.MathUtils.lerp(this.modelsInitialParams.earphoneLIdle.rotation.z, this.modelsInitialParams.earphoneLIdle.rotation.z + Math.PI / 12, this.hoverLIntensity.current * this.hoverIntensityGlobal) // Hover on beginning
            }

            if (this.hoverRIntensity.current > 0.01) {
                this.earphoneRIdle.rotation.x = THREE.MathUtils.lerp(this.modelsInitialParams.earphoneRIdle.rotation.x, this.modelsInitialParams.earphoneRIdle.rotation.x - Math.PI / 20, this.hoverRIntensity.current * this.hoverIntensityGlobal) // Hover on beginning
                this.earphoneRIdle.rotation.y = THREE.MathUtils.lerp(this.modelsInitialParams.earphoneRIdle.rotation.y, this.modelsInitialParams.earphoneRIdle.rotation.y + Math.PI / 20, this.hoverRIntensity.current * this.hoverIntensityGlobal) // Hover on beginning
                this.earphoneRIdle.rotation.z = THREE.MathUtils.lerp(this.modelsInitialParams.earphoneRIdle.rotation.z, this.modelsInitialParams.earphoneRIdle.rotation.z - Math.PI / 12, this.hoverRIntensity.current * this.hoverIntensityGlobal) // Hover on beginning
            }

            if (this.hoverCameraIntensity > 0.01 && !ScrollController.isTransitioning) {
                this.gl.world.renderPlane.mesh.material.uniforms.uBarrelStrength.value = 0.25
                this.gl.world.renderPlane.mesh.material.uniforms.uBarrelDistort.value = THREE.MathUtils.lerp(0, 0.5, this.hoverCameraIntensity)
                this.particles.instance.scale.set(THREE.MathUtils.lerp(1, 0.9, this.hoverCameraIntensity), THREE.MathUtils.lerp(1, 0.9, this.hoverCameraIntensity), 1)
                this.camera.zoom = THREE.MathUtils.lerp(1, 1.05, this.hoverCameraIntensity)
                this.camera.updateProjectionMatrix()

                // Audio
                this.gl.assets.audio.synthLoop.filters[0].frequency.setValueAtTime(10 + this.hoverCameraIntensity * 650, this.gl.assets.audio.synthLoop.context.currentTime)
                // this.gl.assets.audio.synthLoop.setVolume(1.0 - intensity * 0.5)

                // Wave Global Speed
                this.waves.globalSpeed = 1.0 - this.hoverCameraIntensity

                // Particles Global Speed
                this.particles.globalSpeed = 1.0 - this.hoverCameraIntensity
            }
        }

        /* 
          Fresnel
        */
        if (this.actionFresnel) {
            this.materialEarphoneGlassR.uniforms.tFluidCursor.value = this.gl.world.fluidCursor.sourceTarget.texture
            this.materialEarphoneGlassL.uniforms.tFluidCursor.value = this.gl.world.fluidCursor.sourceTarget.texture
            this.materialEarphoneBaseR.uniforms.tFluidCursor.value = this.gl.world.fluidCursor.sourceTarget.texture
            this.materialEarphoneBaseL.uniforms.tFluidCursor.value = this.gl.world.fluidCursor.sourceTarget.texture
        }

        /* 
          Hover Trigger DOM
        */
        if (this.actionCClass) {
            this.intersectedInteractivityObjects = this.raycaster.intersectObjects([this.earphoneRRaycastMic, this.earphoneRRaycastSpeaker, this.earphoneRRaycastVolumeUp, this.earphoneRRaycastVolumeDown, this.earphoneTouchPad])

            if (this.intersectedInteractivityObjects.length > 0) {
                if (this.intersectedInteractivityObjects[0].object.name == 'earphone-r-raycast-volume-up') {
                    this.earphoneRRaycastVolumeUpChildren.lookAt(this.cameraWrapper.position)
                    this.earphoneRRaycastVolumeUpChildren.rotateY(-Math.PI * 0.5)
                    this.earphoneRRaycastVolumeUpChildren.rotateX(Math.PI * 0.5)

                    this.interactivityTargetRotation.setFromEuler(this.earphoneRRaycastVolumeUpChildren.rotation).multiplyScalar(0.35 * this.actions.position.x)

                    this.hoveredEarphoneDOM = 'earphone-r-raycast-volume-up'
                }

                if (this.intersectedInteractivityObjects[0].object.name == 'earphone-r-raycast-volume-down') {
                    this.earphoneRRaycastVolumeDownChildren.lookAt(this.cameraWrapper.position)
                    this.earphoneRRaycastVolumeDownChildren.rotateY(-Math.PI * 0.5)
                    this.earphoneRRaycastVolumeDownChildren.rotateX(Math.PI * 0.5)

                    this.interactivityTargetRotation.setFromEuler(this.earphoneRRaycastVolumeDownChildren.rotation).multiplyScalar(0.35 * this.actions.position.x)

                    this.hoveredEarphoneDOM = 'earphone-r-raycast-volume-down'
                }

                if (this.intersectedInteractivityObjects[0].object.name == 'earphone-r-raycast-speaker') {
                    this.earphoneRRaycastSpeakerChildren.lookAt(this.cameraWrapper.position)
                    this.earphoneRRaycastSpeakerChildren.rotateX(Math.PI * 0.5)

                    this.interactivityTargetRotation.setFromEuler(this.earphoneRRaycastSpeakerChildren.rotation).multiplyScalar(0.75 * this.actions.position.x)

                    this.hoveredEarphoneDOM = 'earphone-r-raycast-speaker'
                }

                if (this.intersectedInteractivityObjects[0].object.name == 'earphone-r-raycast-mic') {
                    this.earphoneRRaycastMicChildren.lookAt(this.cameraWrapper.position)
                    this.earphoneRRaycastMicChildren.rotateZ(-Math.PI * 0.5)

                    this.interactivityTargetRotation.setFromEuler(this.earphoneRRaycastMicChildren.rotation).multiplyScalar(0.5 * this.actions.position.x)

                    this.hoveredEarphoneDOM = 'earphone-r-raycast-mic'
                }

                if (this.intersectedInteractivityObjects[0].object.name == 'earphone-r-touch-pad' || this.intersectedInteractivityObjects[1] ? .object.name == 'earphone-r-touch-pad') {
                    this.touchPadMouse.target = this.intersectedInteractivityObjects[1] ? .uv ? this.intersectedInteractivityObjects[1].uv : this.intersectedInteractivityObjects[0].uv
                }
            } else {
                this.hoveredEarphoneDOM = null

                this.touchPadMouse.target.set(0.0, 0.0)

                this.interactivityTargetRotation.set(0, 0, 0)
            }

            /* 
              TouchPad Mouse Ease
            */
            this.earphoneTouchPad.material.uniforms.uMouseUv.value.x = THREE.MathUtils.damp(this.earphoneTouchPad.material.uniforms.uMouseUv.value.x, this.touchPadMouse.target.x, 0.05, this.gl.time.delta)
            this.earphoneTouchPad.material.uniforms.uMouseUv.value.y = THREE.MathUtils.damp(this.earphoneTouchPad.material.uniforms.uMouseUv.value.y, this.touchPadMouse.target.y, 0.05, this.gl.time.delta)

            this.earphoneTouchPad.material.uniforms.uFrequency.value = this.gl.audio.frequencies.synthLoop.current * 0.05
        } else {
            this.interactivityTargetRotation.set(0, 0, 0)
        }

        if (this.hoveredEarphoneDOM != this.previousHoveredEarphoneDOM) {
            if (this.hoveredEarphoneDOM) {
                switch (this.hoveredEarphoneDOM) {
                    case 'earphone-r-raycast-mic':
                        this.gl.world.setInteractiveHoverClass(4)

                        this.triggerVolumeHover(-1)
                        this.triggerSpeakerHover(-1)

                        break
                    case 'earphone-r-raycast-speaker':
                        this.gl.world.setInteractiveHoverClass(5)

                        this.triggerVolumeHover(-1)
                        this.triggerSpeakerHover(1)

                        break
                    case 'earphone-r-raycast-volume-up':
                        this.gl.world.setInteractiveHoverClass(6)

                        this.triggerVolumeHover(1, 'up')
                        this.triggerSpeakerHover(-1)
                        break
                    case 'earphone-r-raycast-volume-down':
                        this.gl.world.setInteractiveHoverClass(6)

                        this.triggerVolumeHover(1, 'down')
                        this.triggerSpeakerHover(-1)
                        break
                }

                this.gl.world.setHoverIntensity(-1)
            } else {
                this.gl.world.removeInteractiveHoverClasses()
                this.gl.world.setHoverIntensity(1)

                this.triggerVolumeHover(-1)
                this.triggerSpeakerHover(-1)
            }
        }

        /* 
          Set Previous
        */
        this.previousHover = this.isHovering
        this.previousHoveredEarphone = this.hoveredEarphone
        this.previousHoveredEarphoneDOM = this.hoveredEarphoneDOM
    }

    updateMaterials() {
        this.materialCore.uniforms.uTime.value = this.gl.time.elapsed
        this.earphoneCoreLBloom.material.uniforms.uTime.value = this.gl.time.elapsed
        this.earphoneTouchPad.material.uniforms.uTime.value = this.gl.time.elapsed * 0.1
    }

    updateAudio() {
        if (this.actionAudio > 0 && Scroll.progress > 0.5 && !ScrollController.isTransitioning) {
            this.gl.assets.audio.synthLoop.filters[0].frequency.setValueAtTime(10 + this.actionAudio * 650, this.gl.assets.audio.synthLoop.context.currentTime)
        }

        // Power Loop
        if (this.actionPowerLoop > 0) {
            // this.gl.assets.audio.synthLoop.setVolume(1.0 - this.actionPowerLoop)
            this.gl.assets.audio.powerLoop.setVolume(this.actionPowerLoop * this.gl.audio.defaultVolumes.powerLoop)
        }
    }

    triggerVolumeHover(_direction, _side) {
        if (_direction == 1) {
            gsap.to(this.earphoneRVolume.rotation, {
                z: _side == 'up' ? this.modelsInitialParams.earphoneVolume.rotation.z + 0.015 : this.modelsInitialParams.earphoneVolume.rotation.z - 0.015,
                duration: 0.15,
                ease: 'none',
            })

            gsap.to(this.earphoneRVolume.position, {
                x: this.modelsInitialParams.earphoneVolume.position.x - 0.0025,
                duration: 0.15,
                ease: 'none',
            })

            if (_side == 'up') {
                gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeUpHover, {
                    value: 1,
                    duration: 0.15,
                    ease: 'none',
                })

                gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeDownHover, {
                    value: 0,
                    duration: 0.15,
                    ease: 'none',
                })

                gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeShadowUp, {
                    value: 0.05,
                    duration: 0.15,
                    ease: 'none',
                })

                gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeShadowDown, {
                    value: 0,
                    duration: 0.15,
                    ease: 'none',
                })
            } else {
                gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeDownHover, {
                    value: 1,
                    duration: 0.15,
                    ease: 'none',
                })

                gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeUpHover, {
                    value: 0,
                    duration: 0.15,
                    ease: 'none',
                })

                gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeShadowDown, {
                    value: 0.05,
                    duration: 0.15,
                    ease: 'none',
                })

                gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeShadowUp, {
                    value: 0,
                    duration: 0.15,
                    ease: 'none',
                })
            }
        } else {
            gsap.to(this.earphoneRVolume.rotation, {
                z: this.modelsInitialParams.earphoneVolume.rotation.z,
                duration: 0.15,
                ease: 'none',
            })

            gsap.to(this.earphoneRVolume.position, {
                x: this.modelsInitialParams.earphoneVolume.position.x,
                duration: 0.15,
                ease: 'none',
            })

            gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeUpHover, {
                value: 0,
                duration: 0.15,
                ease: 'none',
            })

            gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeDownHover, {
                value: 0,
                duration: 0.15,
                ease: 'none',
            })

            gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeShadowUp, {
                value: 0,
                duration: 0.15,
                ease: 'none',
            })

            gsap.to(this.materialEarphoneBaseR.uniforms.uVolumeShadowDown, {
                value: 0,
                duration: 0.15,
                ease: 'none',
            })
        }
    }

    triggerSpeakerHover(_direction) {
        if (_direction == 1) {
            gsap.to(this.earphoneTouchPad.material.uniforms.uReveal, {
                value: 1,
                duration: 1.25,
                ease: 'power1.inOut',
            })
        } else {
            gsap.to(this.earphoneTouchPad.material.uniforms.uReveal, {
                value: 0,
                duration: 1.25,
                ease: 'power1.inOut',
            })
        }
    }

    update() {
        if (!this.isRendering) return

        this.updateCamera()
        this.updateLights()
        this.updateHover()
        this.updateInteractivity()
        this.updateIdle()
        this.updateTube()
        this.updateProjectedPoints()
        this.updateBloom()
        this.updateMaterials()
        this.updateAudio()

        /* 
          Classes
        */
        this.circles.update()
        this.waves.update()
        this.particles.update()
    }
}