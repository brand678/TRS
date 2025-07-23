/**
 * TRANSLINK - Cursor Module
 * Custom cursor with smooth animations and interactive states
 */

import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * CursorModule - Custom cursor with smooth following and state changes
 */
export class CursorModule extends EventEmitter {
    constructor(element, options = {}) {
        super();
        
        this.logger = new Logger('CursorModule');
        this.element = element;
        this.options = {
            webgl: null,
            audio: null,
            themeSystem: null,
            debug: false,
            smoothing: 0.1,
            scale: 1,
            ...options
        };
        
        // Cursor state
        this.position = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.scale = this.options.scale;
        this.targetScale = this.options.scale;
        
        // Animation
        this.animationId = null;
        this.isAnimating = false;
        
        // State
        this.isVisible = false;
        this.isHovering = false;
        this.currentState = 'default';
        
        // Elements
        this.cursor = null;
        this.cursorInner = null;
        this.cursorText = null;
        
        this.logger.info('CursorModule created');
    }

    /**
     * Initialize cursor module
     */
    async init() {
        try {
            this.logger.info('Initializing CursorModule...');
            
            // Check if device supports custom cursor
            if (this.isMobileDevice()) {
                this.logger.info('Mobile device detected, skipping cursor initialization');
                return;
            }
            
            // Set up cursor structure
            this.setupCursorStructure();
            
            // Set up styling
            this.setupStyling();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start animation loop
            this.startAnimation();
            
            this.emit('cursor:initialized');
            this.logger.info('CursorModule initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize CursorModule:', error);
            throw error;
        }
    }

    /**
     * Check if device is mobile
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    /**
     * Set up cursor structure
     */
    setupCursorStructure() {
        // Create cursor elements if they don't exist
        if (!this.element.querySelector('.cursor__inner')) {
            this.element.innerHTML = `
                <div class="cursor__inner">
                    <div class="cursor__dot"></div>
                </div>
                <div class="cursor__text"></div>
            `;
        }
        
        // Get references
        this.cursor = this.element;
        this.cursorInner = this.element.querySelector('.cursor__inner');
        this.cursorText = this.element.querySelector('.cursor__text');
        
        // Set initial position
        this.cursor.style.transform = 'translate3d(-50%, -50%, 0)';
        
        this.logger.debug('Cursor structure set up');
    }

    /**
     * Set up cursor styling
     */
    setupStyling() {
        // Add base classes
        this.cursor.classList.add('cursor');
        
        // Add CSS if not already present
        this.addCursorStyles();
        
        this.logger.debug('Cursor styling set up');
    }

    /**
     * Add cursor CSS styles
     */
    addCursorStyles() {
        if (document.getElementById('cursor-module-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'cursor-module-styles';
        style.textContent = `
            .cursor {
                position: fixed;
                top: 0;
                left: 0;
                width: 20px;
                height: 20px;
                pointer-events: none;
                z-index: 9999;
                mix-blend-mode: difference;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .cursor--visible {
                opacity: 1;
            }
            
            .cursor__inner {
                position: relative;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: var(--color-text);
                transition: all 0.3s ease;
            }
            
            .cursor__dot {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 4px;
                height: 4px;
                background: var(--color-background);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: all 0.3s ease;
            }
            
            .cursor__text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 12px;
                font-weight: 500;
                color: var(--color-text);
                white-space: nowrap;
                opacity: 0;
                transition: all 0.3s ease;
                pointer-events: none;
            }
            
            .cursor--hover .cursor__inner {
                transform: scale(2);
                background: transparent;
                border: 2px solid var(--color-text);
            }
            
            .cursor--hover .cursor__dot {
                opacity: 0;
            }
            
            .cursor--click .cursor__inner {
                transform: scale(0.8);
            }
            
            .cursor--text .cursor__inner {
                transform: scale(3);
                background: var(--color-accent);
            }
            
            .cursor--text .cursor__text {
                opacity: 1;
                color: var(--color-background);
            }
            
            .cursor--text .cursor__dot {
                opacity: 0;
            }
            
            .cursor--hidden {
                opacity: 0 !important;
            }
            
            /* Hide default cursor on interactive elements */
            .cursor-active * {
                cursor: none !important;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Mouse movement
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Mouse enter/leave document
        document.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Mouse down/up for click state
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Hover states for interactive elements
        this.setupHoverListeners();
        
        this.logger.debug('Event listeners set up');
    }

    /**
     * Set up hover listeners for interactive elements
     */
    setupHoverListeners() {
        const interactiveSelectors = [
            'a',
            'button',
            '[role="button"]',
            'input',
            'textarea',
            'select',
            '.interactive',
            '[data-cursor]'
        ];
        
        const elements = document.querySelectorAll(interactiveSelectors.join(', '));
        
        elements.forEach(element => {
            element.addEventListener('mouseenter', this.handleElementHover.bind(this));
            element.addEventListener('mouseleave', this.handleElementUnhover.bind(this));
        });
        
        this.logger.debug(`Set up hover listeners for ${elements.length} interactive elements`);
    }

    /**
     * Handle mouse movement
     */
    handleMouseMove(event) {
        this.targetPosition.x = event.clientX;
        this.targetPosition.y = event.clientY;
        
        if (!this.isVisible) {
            this.show();
        }
    }

    /**
     * Handle mouse enter document
     */
    handleMouseEnter() {
        this.show();
    }

    /**
     * Handle mouse leave document
     */
    handleMouseLeave() {
        this.hide();
    }

    /**
     * Handle mouse down
     */
    handleMouseDown() {
        this.setState('click');
    }

    /**
     * Handle mouse up
     */
    handleMouseUp() {
        this.setState(this.isHovering ? 'hover' : 'default');
    }

    /**
     * Handle element hover
     */
    handleElementHover(event) {
        const element = event.currentTarget;
        const cursorData = element.getAttribute('data-cursor');
        
        this.isHovering = true;
        
        if (cursorData) {
            this.setState('text', cursorData);
        } else {
            this.setState('hover');
        }
        
        this.emit('cursor:element-hover', element);
    }

    /**
     * Handle element unhover
     */
    handleElementUnhover(event) {
        this.isHovering = false;
        this.setState('default');
        
        this.emit('cursor:element-unhover', event.currentTarget);
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.isAnimating) {
            return;
        }
        
        this.isAnimating = true;
        
        const animate = () => {
            if (!this.isAnimating) {
                return;
            }
            
            this.updatePosition();
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
        this.logger.debug('Animation loop started');
    }

    /**
     * Stop animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.logger.debug('Animation loop stopped');
    }

    /**
     * Update cursor position with smooth following
     */
    updatePosition() {
        // Calculate velocity
        this.velocity.x = (this.targetPosition.x - this.position.x) * this.options.smoothing;
        this.velocity.y = (this.targetPosition.y - this.position.y) * this.options.smoothing;
        
        // Update position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        // Update scale
        this.scale += (this.targetScale - this.scale) * 0.1;
        
        // Apply transform
        const rotation = Math.atan2(this.velocity.y, this.velocity.x) * (180 / Math.PI);
        
        this.cursor.style.transform = `
            translate3d(${this.position.x}px, ${this.position.y}px, 0)
            scale(${this.scale})
            rotate(${rotation * 0.1}deg)
        `;
    }

    /**
     * Set cursor state
     */
    setState(state, text = '') {
        if (this.currentState === state) {
            return;
        }
        
        // Remove previous state class
        this.cursor.classList.remove(`cursor--${this.currentState}`);
        
        // Add new state class
        this.currentState = state;
        this.cursor.classList.add(`cursor--${this.currentState}`);
        
        // Update text if provided
        if (text && this.cursorText) {
            this.cursorText.textContent = text;
        } else if (this.cursorText) {
            this.cursorText.textContent = '';
        }
        
        // Update scale based on state
        switch (state) {
            case 'hover':
                this.targetScale = 1.5;
                break;
            case 'click':
                this.targetScale = 0.8;
                break;
            case 'text':
                this.targetScale = 2;
                break;
            default:
                this.targetScale = 1;
        }
        
        this.emit('cursor:state-changed', state);
        this.logger.debug(`Cursor state changed to: ${state}`);
    }

    /**
     * Show cursor
     */
    show() {
        if (this.isVisible) {
            return;
        }
        
        this.isVisible = true;
        this.cursor.classList.add('cursor--visible');
        
        // Add cursor-active class to body to hide default cursor
        document.body.classList.add('cursor-active');
        
        this.emit('cursor:shown');
        this.logger.debug('Cursor shown');
    }

    /**
     * Hide cursor
     */
    hide() {
        if (!this.isVisible) {
            return;
        }
        
        this.isVisible = false;
        this.cursor.classList.remove('cursor--visible');
        
        // Remove cursor-active class from body
        document.body.classList.remove('cursor-active');
        
        this.emit('cursor:hidden');
        this.logger.debug('Cursor hidden');
    }

    /**
     * Set cursor text
     */
    setText(text) {
        if (this.cursorText) {
            this.cursorText.textContent = text;
        }
        
        if (text) {
            this.setState('text', text);
        } else {
            this.setState('default');
        }
    }

    /**
     * Handle page transition
     */
    async onPageTransition(toPage, fromPage) {
        this.logger.debug(`Cursor page transition: ${fromPage} → ${toPage}`);
        
        // Re-setup hover listeners for new page content
        setTimeout(() => {
            this.setupHoverListeners();
        }, 100);
        
        this.emit('cursor:page-transition', { toPage, fromPage });
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying CursorModule...');
        
        // Stop animation
        this.stopAnimation();
        
        // Hide cursor
        this.hide();
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseenter', this.handleMouseEnter);
        document.removeEventListener('mouseleave', this.handleMouseLeave);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        // Remove hover listeners
        const elements = document.querySelectorAll('[data-cursor], a, button, [role="button"], input, textarea, select, .interactive');
        elements.forEach(element => {
            element.removeEventListener('mouseenter', this.handleElementHover);
            element.removeEventListener('mouseleave', this.handleElementUnhover);
        });
        
        // Remove cursor-active class
        document.body.classList.remove('cursor-active');
        
        // Clear references
        this.cursor = null;
        this.cursorInner = null;
        this.cursorText = null;
        
        this.removeAllListeners();
        this.logger.info('CursorModule destroyed');
    }
}

export default CursorModule;