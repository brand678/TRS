/**
 * TRANSLINK - Animation System
 * Centralized animation management with timeline support
 */

import { EventEmitter } from './EventEmitter.js'
import { Logger } from './Logger.js'

/**
 * AnimationSystem - Manages animations and timelines
 */
export class AnimationSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('AnimationSystem');
        this.options = {
            debug: false,
            ...options
        };
        
        // Animation registry
        this.timelines = new Map();
        this.animations = new Map();
        
        // State
        this.isRunning = false;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.lastTime = 0;
        
        // Animation frame
        this.animationId = null;
        
        this.logger.info('AnimationSystem created');
    }

    /**
     * Initialize animation system
     */
    init() {
        this.logger.info('Initializing AnimationSystem...');
        
        try {
            // Start animation loop
            this.start();
            
            this.emit('animation:initialized');
            this.logger.info('AnimationSystem initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize AnimationSystem:', error);
            throw error;
        }
    }

    /**
     * Start animation loop
     */
    start() {
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.lastTime = performance.now();
        
        const animate = (currentTime) => {
            if (!this.isRunning) {
                return;
            }
            
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.elapsedTime = currentTime / 1000;
            this.lastTime = currentTime;
            
            this.update();
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
        this.logger.debug('Animation loop started');
    }

    /**
     * Stop animation loop
     */
    stop() {
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.logger.debug('Animation loop stopped');
    }

    /**
     * Update all animations
     */
    update() {
        // Update timelines
        for (const [id, timeline] of this.timelines) {
            if (timeline.isActive) {
                timeline.update(this.deltaTime);
            }
        }
        
        // Update individual animations
        for (const [id, animation] of this.animations) {
            if (animation.isActive) {
                animation.update(this.deltaTime);
            }
        }
        
        this.emit('animation:update', {
            deltaTime: this.deltaTime,
            elapsedTime: this.elapsedTime
        });
    }

    /**
     * Create a new timeline
     */
    createTimeline(options = {}) {
        const timeline = new Timeline({
            ...options,
            animationSystem: this
        });
        
        const id = `timeline-${Date.now()}-${Math.random()}`;
        this.timelines.set(id, timeline);
        
        timeline.id = id;
        timeline.onDestroy = () => {
            this.timelines.delete(id);
        };
        
        this.logger.debug(`Created timeline: ${id}`);
        return timeline;
    }

    /**
     * Create a new animation
     */
    createAnimation(target, properties, options = {}) {
        const animation = new Animation(target, properties, {
            ...options,
            animationSystem: this
        });
        
        const id = `animation-${Date.now()}-${Math.random()}`;
        this.animations.set(id, animation);
        
        animation.id = id;
        animation.onDestroy = () => {
            this.animations.delete(id);
        };
        
        this.logger.debug(`Created animation: ${id}`);
        return animation;
    }

    /**
     * Get timeline by ID
     */
    getTimeline(id) {
        return this.timelines.get(id);
    }

    /**
     * Get animation by ID
     */
    getAnimation(id) {
        return this.animations.get(id);
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying AnimationSystem...');
        
        // Stop animation loop
        this.stop();
        
        // Destroy all timelines
        for (const [id, timeline] of this.timelines) {
            timeline.destroy();
        }
        
        // Destroy all animations
        for (const [id, animation] of this.animations) {
            animation.destroy();
        }
        
        this.timelines.clear();
        this.animations.clear();
        
        this.removeAllListeners();
        this.logger.info('AnimationSystem destroyed');
    }
}

/**
 * Timeline class for managing sequences of animations
 */
class Timeline extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            paused: false,
            repeat: 0,
            yoyo: false,
            delay: 0,
            ...options
        };
        
        this.animations = [];
        this.currentTime = 0;
        this.duration = 0;
        this.isActive = !this.options.paused;
        this.isComplete = false;
        this.repeatCount = 0;
        
        this.id = null;
        this.onDestroy = null;
    }

    /**
     * Add animation to timeline
     */
    to(target, properties, options = {}) {
        const animation = new Animation(target, properties, {
            ...options,
            startTime: this.duration + (options.delay || 0)
        });
        
        this.animations.push(animation);
        this.duration = Math.max(this.duration, animation.startTime + animation.duration);
        
        return this;
    }

    /**
     * Set timeline properties
     */
    set(target, properties) {
        // Immediately set properties
        Object.assign(target, properties);
        return this;
    }

    /**
     * Play timeline
     */
    play() {
        this.isActive = true;
        this.isComplete = false;
        this.emit('timeline:play');
        return this;
    }

    /**
     * Pause timeline
     */
    pause() {
        this.isActive = false;
        this.emit('timeline:pause');
        return this;
    }

    /**
     * Restart timeline
     */
    restart() {
        this.currentTime = 0;
        this.isComplete = false;
        this.repeatCount = 0;
        this.play();
        this.emit('timeline:restart');
        return this;
    }

    /**
     * Set timeline progress (0-1)
     */
    progress(value) {
        this.currentTime = value * this.duration;
        this.updateAnimations();
        this.emit('timeline:progress', value);
        return this;
    }

    /**
     * Update timeline
     */
    update(deltaTime) {
        if (!this.isActive || this.isComplete) {
            return;
        }
        
        this.currentTime += deltaTime;
        
        if (this.currentTime >= this.duration) {
            if (this.options.repeat === -1 || this.repeatCount < this.options.repeat) {
                this.repeatCount++;
                this.currentTime = 0;
                
                if (this.options.yoyo) {
                    // Reverse animations for yoyo effect
                    this.animations.forEach(anim => anim.reverse());
                }
            } else {
                this.isComplete = true;
                this.isActive = false;
                this.emit('timeline:complete');
            }
        }
        
        this.updateAnimations();
    }

    /**
     * Update all animations in timeline
     */
    updateAnimations() {
        this.animations.forEach(animation => {
            const localTime = this.currentTime - animation.startTime;
            
            if (localTime >= 0 && localTime <= animation.duration) {
                animation.updateProgress(localTime / animation.duration);
            }
        });
    }

    /**
     * Kill timeline
     */
    kill() {
        this.isActive = false;
        this.isComplete = true;
        this.animations = [];
        this.emit('timeline:killed');
        
        if (this.onDestroy) {
            this.onDestroy();
        }
    }

    /**
     * Destroy timeline
     */
    destroy() {
        this.kill();
        this.removeAllListeners();
    }
}

/**
 * Animation class for individual property animations
 */
class Animation extends EventEmitter {
    constructor(target, properties, options = {}) {
        super();
        
        this.target = target;
        this.properties = properties;
        this.options = {
            duration: 1,
            ease: 'linear',
            delay: 0,
            startTime: 0,
            ...options
        };
        
        this.startValues = {};
        this.currentValues = {};
        this.duration = this.options.duration;
        this.startTime = this.options.startTime;
        this.isActive = true;
        this.isReversed = false;
        
        this.id = null;
        this.onDestroy = null;
        
        // Store initial values
        this.storeInitialValues();
    }

    /**
     * Store initial values of animated properties
     */
    storeInitialValues() {
        Object.keys(this.properties).forEach(key => {
            if (this.target[key] !== undefined) {
                this.startValues[key] = this.target[key];
                this.currentValues[key] = this.target[key];
            }
        });
    }

    /**
     * Update animation progress
     */
    updateProgress(progress) {
        const easedProgress = this.applyEasing(progress);
        
        Object.keys(this.properties).forEach(key => {
            const startValue = this.startValues[key];
            const endValue = this.properties[key];
            
            if (typeof startValue === 'number' && typeof endValue === 'number') {
                this.currentValues[key] = this.lerp(startValue, endValue, easedProgress);
                this.target[key] = this.currentValues[key];
            } else if (typeof endValue === 'object' && endValue.value !== undefined) {
                // Handle uniform values
                const start = startValue?.value || startValue || 0;
                const end = endValue.value;
                const current = this.lerp(start, end, easedProgress);
                
                if (this.target[key] && this.target[key].value !== undefined) {
                    this.target[key].value = current;
                } else {
                    this.target[key] = current;
                }
            }
        });
        
        this.emit('animation:progress', progress);
    }

    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * Apply easing function
     */
    applyEasing(t) {
        switch (this.options.ease) {
            case 'linear':
                return t;
            case 'easeIn':
                return t * t;
            case 'easeOut':
                return 1 - Math.pow(1 - t, 2);
            case 'easeInOut':
                return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            default:
                return t;
        }
    }

    /**
     * Reverse animation
     */
    reverse() {
        this.isReversed = !this.isReversed;
        
        // Swap start and end values
        const tempStart = { ...this.startValues };
        this.startValues = { ...this.properties };
        this.properties = tempStart;
    }

    /**
     * Update animation
     */
    update(deltaTime) {
        // This method is called by the animation system
        // Individual animations are updated through updateProgress
    }

    /**
     * Destroy animation
     */
    destroy() {
        this.isActive = false;
        this.removeAllListeners();
        
        if (this.onDestroy) {
            this.onDestroy();
        }
    }
}

export { AnimationSystem, Timeline, Animation };