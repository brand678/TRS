import {
    Scroll
} from '../scroll'
import Gl from '../gl/Gl'
import {
    Raf
} from '@/utils/subscribable'
import {
    damp
} from 'three/src/math/MathUtils.js'

class _ScrollController {
    constructor() {
        Scroll.stop()

        /* 
          Flags
        */
        this.isTransitioning = false
        this.preventScrollUpdate = false
        this.isBackwardLoopingAllowed = false
        this.isOnEdge = false

        /* 
          Velocity  
        */
        this.velocity = 0
        this.previousVelocity = 0
        this.easedVelocity = 0

        /* 
          Stops
        */
        // this.stops = [0, 0.14, 0.31, 0.485, 0.65, 0.83]
        // Original: 0, 162, 359, 562, 754, 962
        // Target:   0, 193, 386, 579, 772, 965

        /* 
          Direction
        */
        this.direction = 0

        /* 
          Params
        */
        this.params = {
            threshold: 50,
        }

        /* 
          Progress
        */
        this.previousScroll = Scroll.progress
        this.nextProgress = Scroll.progress

        /* 
          Events
        */
        document.addEventListener('wheel', this.handleTresholdNudge.bind(this))
    }

    init() {
        this.gl = new Gl()

        this.setLoop()
        this.setIdleScroll()
        this.setSceneProgress()
        this.setProgressIndicator()
        this.update()
    }

    setSceneProgress() {
        Scroll.on('scroll', () => {
            if (this.preventScrollUpdate) return

            this.gl.world.mainScene.current.updateScroll(Scroll.progress)
        })
    }

    setLoop() {
        Scroll.on('scroll', () => {
            /* 
              Block on edge
            */
            this.nextProgress = Scroll.progress + Scroll.velocity / Scroll.limit

            if (this.nextProgress < 0) {
                this.isOnEdge = true
                this.velocity = 0 // Reset velocity if scroll is too fast

                if (this.isBackwardLoopingAllowed) this.preventScrollUpdate = true

                Scroll.stop()
            }

            if (this.nextProgress > 1) {
                this.preventScrollUpdate = true

                // if (this.gl.isDebug) console.log('Scroll transition: 1')

                // this.isOnEdge = true
                // this.velocity = 0 // Reset velocity if scroll is too fast

                // Scroll.stop()
            }

            /* 
              Wait until block gets removed (Lenis restarted) via custom scroll velocity in handleTresholdNudge() function
            */
            if (this.previousScroll > Scroll.progress && Scroll.direction == 1) {
                if (this.gl.isDebug) console.log('Scroll transition: 1')

                this.loopForward()
            }

            if (this.previousScroll < Scroll.progress && Scroll.direction == -1) {
                if (this.gl.isDebug) console.log('Scroll transition: -1')

                this.loopBackward()
            }

            /* 
              Set previous scroll
            */
            this.previousScroll = Scroll.progress
        })
    }

    async loopForward() {
        Scroll.stop()

        this.isTransitioning = true

        await this.gl.world.translate(1)

        this.isTransitioning = false
        this.preventScrollUpdate = false

        this.isBackwardLoopingAllowed = true

        // Scroll.start()
    }

    async loopBackward() {
        Scroll.stop()

        this.isTransitioning = true

        await this.gl.world.translate(-1)

        this.isTransitioning = false
        this.preventScrollUpdate = false

        Scroll.start()
    }

    setIdleScroll() {
        const options = {
            easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
        }

        this.scrollTimeout = setTimeout(() => {
            Scroll.scrollTo(this.getSectionAnchor(), options)
        }, 50)

        Scroll.on('scroll', () => {
            clearTimeout(this.scrollTimeout)

            this.scrollTimeout = setTimeout(() => {
                Scroll.scrollTo(this.getSectionAnchor(), options)
            }, 50)
        })
    }

    setProgressIndicator() {
        Scroll.on('scroll', (_progress) => {
            if (this.isTransitioning) return

            this.gl.world.renderPlane.mesh.material.uniforms.uProgress.value = Scroll.progress
        })
    }

    handleTresholdNudge(_e) {
        this.getScrollVelocity(_e)
        this.getDirection(_e)

        // Return if transitioning
        if (this.isTransitioning) return

        // Forward
        if (Scroll.isStopped) {
            if (this.direction == 1 && !this.isTransitioning) {
                Scroll.start()
            }
        }

        // if (Scroll.progress > 0.9 && Scroll.progress <= 1.0) {
        //   if (this.easedVelocity > this.params.threshold && this.direction == 1) {
        //     Scroll.start()
        //     this.isOnEdge = false
        //   }
        //   if (this.direction == -1) {
        //     Scroll.start()
        //     this.isOnEdge = false
        //   }
        // }

        if (Scroll.progress < 0.1 && Scroll.progress >= 0.0) {
            if (this.easedVelocity < -this.params.threshold && this.direction == -1 && this.isBackwardLoopingAllowed) {
                Scroll.start()

                this.isOnEdge = false
            } else if (this.direction == 1) {
                Scroll.start()

                this.isOnEdge = false

                this.preventScrollUpdate = false
            }
        }
    }

    getSectionAnchor() {
        const sectionLength = 7
        let result = Math.round(Scroll.progress * sectionLength) / sectionLength
        // let result = this.findClosestStop(Scroll.progress, this.stops)
        result *= Scroll.limit

        return result
    }

    findClosestStop(value, stops) {
        return stops.reduce((prev, curr) => {
            return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        })
    }

    getScrollVelocity(_e) {
        if (!this.isTransitioning) {
            // Start working only on edges
            if (this.isOnEdge) {
                this.velocity = _e.deltaY - this.previousVelocity
            } else {
                this.velocity = 0
            }

            // Until backwards loop is not allowed, show only positive number
            if (!this.isBackwardLoopingAllowed) {
                this.velocity = Math.max(this.velocity, 0)
            }
        } else {
            this.velocity = 0
        }
    }

    getDirection(_e) {
        if (_e.deltaY > 0) {
            this.direction = 1
        } else {
            this.direction = -1
        }
    }

    update() {
        Raf.subscribe(() => {
            this.easedVelocity = damp(this.easedVelocity, this.velocity, 0.025, this.gl.time.delta)

            this.velocity = 0

            this.previousVelocity = this.velocity

            this.gl.world.renderPlane.mesh.material.uniforms.uScrollVelocity.value = this.easedVelocity

            console.log(Scroll.progress)
        })
    }
}

const ScrollController = new _ScrollController()

export default ScrollController