/**
 * TRANSLINK - Loader Module
 * Handles loading screen animations and progress indication
 */

import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * LoaderModule - Loading screen management with animations
 */
export class LoaderModule extends EventEmitter {
    constructor(element, options = {}) {
        super();
        
        this.logger = new Logger('LoaderModule');
        this.element = element;
        this.options = {
            webgl: null,
            audio: null,
            themeSystem: null,
            debug: false,
            minDuration: 2000, // Minimum loading time in ms
            ...options
        };
        
        // Loading state
        this.isLoading = true;
        this.progress = 0;
        this.startTime = Date.now();
        
        // Animation elements
        this.circles = [];
        this.progressText = null;
        this.loadingText = null;
        
        this.logger.info('LoaderModule created');
    }

    /**
     * Initialize loader module
     */
    async init() {
        try {
            this.logger.info('Initializing LoaderModule...');
            
            // Find elements
            this.findElements();
            
            // Set up animations
            this.setupAnimations();
            
            // Set up progress tracking
            this.setupProgressTracking();
            
            // Start loading animation
            this.startLoadingAnimation();
            
            this.emit('loader:initialized');
            this.logger.info('LoaderModule initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize LoaderModule:', error);
            throw error;
        }
    }

    /**
     * Find loader elements
     */
    findElements() {
        // Find loading circles
        this.circles = Array.from(this.element.querySelectorAll('.loader__circle'));
        
        // Find progress text
        this.progressText = this.element.querySelector('.loader__progress');
        
        // Find loading text
        this.loadingText = this.element.querySelector('.loader__text');
        
        this.logger.debug(`Found ${this.circles.length} loading circles`);
    }

    /**
     * Set up animations
     */
    setupAnimations() {
        // Set initial states for circles
        this.circles.forEach((circle, index) => {
            circle.style.transform = 'scale(0)';
            circle.style.opacity = '0';
        });
        
        // Set initial state for text
        if (this.loadingText) {
            this.loadingText.style.opacity = '0';
            this.loadingText.style.transform = 'translateY(20px)';
        }
        
        if (this.progressText) {
            this.progressText.style.opacity = '0';
        }
        
        this.logger.debug('Animation initial states set');
    }

    /**
     * Set up progress tracking
     */
    setupProgressTracking() {
        // Listen for asset loading progress
        if (this.options.webgl && this.options.webgl.getSystem) {
            const assetManager = this.options.webgl.getSystem('assets');
            if (assetManager) {
                assetManager.on('progress', this.updateProgress.bind(this));
                assetManager.on('asset:loaded', this.handleAssetLoaded.bind(this));
            }
        }
        
        this.logger.debug('Progress tracking set up');
    }

    /**
     * Start loading animation
     */
    async startLoadingAnimation() {
        this.logger.debug('Starting loading animation');
        
        try {
            // Animate circles in
            await this.animateCirclesIn();
            
            // Animate text in
            await this.animateTextIn();
            
            // Start rotation animation
            this.startRotationAnimation();
            
            this.emit('loader:animation-started');
            
        } catch (error) {
            this.logger.error('Error starting loading animation:', error);
        }
    }

    /**
     * Animate circles in
     */
    animateCirclesIn() {
        return new Promise((resolve) => {
            let completed = 0;
            const total = this.circles.length;
            
            this.circles.forEach((circle, index) => {
                setTimeout(() => {
                    this.animateElement(circle, {
                        transform: 'scale(1)',
                        opacity: '1'
                    }, 600, 'cubic-bezier(0.68, -0.55, 0.265, 1.55)').then(() => {
                        completed++;
                        if (completed === total) {
                            resolve();
                        }
                    });
                }, index * 100);
            });
        });
    }

    /**
     * Animate text in
     */
    animateTextIn() {
        const promises = [];
        
        if (this.loadingText) {
            promises.push(
                this.animateElement(this.loadingText, {
                    opacity: '1',
                    transform: 'translateY(0px)'
                }, 400)
            );
        }
        
        if (this.progressText) {
            promises.push(
                this.animateElement(this.progressText, {
                    opacity: '1'
                }, 400)
            );
        }
        
        return Promise.all(promises);
    }

    /**
     * Start rotation animation
     */
    startRotationAnimation() {
        this.circles.forEach((circle, index) => {
            const duration = 3000 + (index * 200); // Staggered durations
            
            const animate = () => {
                circle.style.transition = `transform ${duration}ms linear`;
                circle.style.transform = `scale(1) rotate(360deg)`;
                
                setTimeout(() => {
                    circle.style.transition = 'none';
                    circle.style.transform = 'scale(1) rotate(0deg)';
                    
                    if (this.isLoading) {
                        requestAnimationFrame(animate);
                    }
                }, duration);
            };
            
            // Start with delay
            setTimeout(animate, index * 150);
        });
        
        this.logger.debug('Rotation animation started');
    }

    /**
     * Update loading progress
     */
    updateProgress(progress) {
        this.progress = Math.max(this.progress, progress);
        
        if (this.progressText) {
            const percentage = Math.round(this.progress * 100);
            this.progressText.textContent = `${percentage}%`;
        }
        
        this.emit('loader:progress', this.progress);
        
        // Check if loading is complete
        if (this.progress >= 1) {
            this.checkLoadingComplete();
        }
    }

    /**
     * Handle asset loaded
     */
    handleAssetLoaded(data) {
        this.logger.debug(`Asset loaded: ${data.type}/${data.name}`);
        this.emit('loader:asset-loaded', data);
    }

    /**
     * Check if loading is complete
     */
    checkLoadingComplete() {
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.options.minDuration - elapsedTime);
        
        // Wait for minimum duration
        setTimeout(() => {
            this.completeLoading();
        }, remainingTime);
    }

    /**
     * Complete loading and hide loader
     */
    async completeLoading() {
        if (!this.isLoading) {
            return;
        }
        
        this.logger.info('Completing loading sequence');
        this.isLoading = false;
        
        try {
            // Update text
            if (this.loadingText) {
                this.loadingText.textContent = 'Ready!';
            }
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Animate out
            await this.animateOut();
            
            // Hide loader
            this.hide();
            
            this.emit('loader:complete');
            
        } catch (error) {
            this.logger.error('Error completing loading:', error);
        }
    }

    /**
     * Animate loader out
     */
    async animateOut() {
        this.logger.debug('Animating loader out');
        
        const promises = [];
        
        // Animate circles out
        this.circles.forEach((circle, index) => {
            promises.push(
                new Promise(resolve => {
                    setTimeout(() => {
                        this.animateElement(circle, {
                            transform: 'scale(0)',
                            opacity: '0'
                        }, 400).then(resolve);
                    }, index * 50);
                })
            );
        });
        
        // Animate text out
        if (this.loadingText) {
            promises.push(
                this.animateElement(this.loadingText, {
                    opacity: '0',
                    transform: 'translateY(-20px)'
                }, 400)
            );
        }
        
        if (this.progressText) {
            promises.push(
                this.animateElement(this.progressText, {
                    opacity: '0'
                }, 400)
            );
        }
        
        await Promise.all(promises);
    }

    /**
     * Hide loader element
     */
    hide() {
        this.element.style.display = 'none';
        this.element.setAttribute('aria-hidden', 'true');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }, 100);
        
        this.logger.debug('Loader hidden');
    }

    /**
     * Animate element with CSS transitions
     */
    animateElement(element, styles, duration = 300, easing = 'ease-out') {
        return new Promise((resolve) => {
            element.style.transition = `all ${duration}ms ${easing}`;
            Object.assign(element.style, styles);
            
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    /**
     * Force complete loading (for debugging)
     */
    forceComplete() {
        this.logger.warn('Force completing loader');
        this.progress = 1;
        this.completeLoading();
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying LoaderModule...');
        
        // Stop loading
        this.isLoading = false;
        
        // Clear references
        this.circles = [];
        this.progressText = null;
        this.loadingText = null;
        
        this.removeAllListeners();
        this.logger.info('LoaderModule destroyed');
    }
}

export default LoaderModule;