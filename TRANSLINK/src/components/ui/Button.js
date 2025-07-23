/**
 * TRANSLINK - Button Component
 * Reusable button component with animations and accessibility
 */

import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * Button - Reusable button component
 */
export class Button extends EventEmitter {
    constructor(element, options = {}) {
        super();
        
        this.logger = new Logger('Button');
        this.element = element;
        this.options = {
            variant: 'primary',
            size: 'medium',
            disabled: false,
            loading: false,
            ripple: true,
            audio: null,
            ...options
        };
        
        // State
        this.isPressed = false;
        this.isHovered = false;
        this.isLoading = false;
        this.isDisabled = this.options.disabled;
        
        // Elements
        this.content = null;
        this.loader = null;
        this.rippleContainer = null;
        
        this.logger.info('Button created');
    }

    /**
     * Initialize button
     */
    init() {
        try {
            this.logger.debug('Initializing button...');
            
            // Set up structure
            this.setupStructure();
            
            // Set up styling
            this.setupStyling();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up accessibility
            this.setupAccessibility();
            
            // Apply initial state
            this.updateState();
            
            this.emit('button:initialized');
            this.logger.debug('Button initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize button:', error);
            throw error;
        }
    }

    /**
     * Set up button structure
     */
    setupStructure() {
        // Store original content
        const originalContent = this.element.innerHTML;
        
        // Create button structure
        this.element.innerHTML = `
            <div class="button__content">
                ${originalContent}
            </div>
            <div class="button__loader" style="display: none;">
                <div class="button__spinner"></div>
            </div>
            <div class="button__ripple-container"></div>
        `;
        
        // Get references
        this.content = this.element.querySelector('.button__content');
        this.loader = this.element.querySelector('.button__loader');
        this.rippleContainer = this.element.querySelector('.button__ripple-container');
        
        this.logger.debug('Button structure set up');
    }

    /**
     * Set up button styling
     */
    setupStyling() {
        // Add base classes
        this.element.classList.add('button');
        this.element.classList.add(`button--${this.options.variant}`);
        this.element.classList.add(`button--${this.options.size}`);
        
        // Add CSS if not already present
        this.addButtonStyles();
        
        this.logger.debug('Button styling set up');
    }

    /**
     * Add button CSS styles
     */
    addButtonStyles() {
        if (document.getElementById('button-component-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'button-component-styles';
        style.textContent = `
            .button {
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border: none;
                border-radius: 0.5rem;
                font-family: inherit;
                font-weight: 500;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s ease;
                overflow: hidden;
                user-select: none;
                outline: none;
            }
            
            .button:focus-visible {
                outline: 2px solid var(--color-accent);
                outline-offset: 2px;
            }
            
            .button--primary {
                background: var(--color-buttonBackground);
                color: var(--color-buttonText);
            }
            
            .button--primary:hover:not(:disabled) {
                background: var(--color-buttonHover);
                transform: translateY(-1px);
            }
            
            .button--secondary {
                background: transparent;
                color: var(--color-accent);
                border: 1px solid var(--color-accent);
            }
            
            .button--secondary:hover:not(:disabled) {
                background: var(--color-accent);
                color: var(--color-background);
            }
            
            .button--small {
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
            }
            
            .button--medium {
                padding: 0.75rem 1.5rem;
                font-size: 1rem;
            }
            
            .button--large {
                padding: 1rem 2rem;
                font-size: 1.125rem;
            }
            
            .button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none !important;
            }
            
            .button--loading .button__content {
                opacity: 0;
            }
            
            .button--loading .button__loader {
                display: flex !important;
            }
            
            .button__content {
                transition: opacity 0.2s ease;
            }
            
            .button__loader {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .button__spinner {
                width: 1rem;
                height: 1rem;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: button-spin 1s linear infinite;
            }
            
            @keyframes button-spin {
                to { transform: rotate(360deg); }
            }
            
            .button__ripple-container {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                overflow: hidden;
                border-radius: inherit;
            }
            
            .button__ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: button-ripple 0.6s ease-out;
                pointer-events: none;
            }
            
            @keyframes button-ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Click events
        this.element.addEventListener('click', this.handleClick.bind(this));
        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Hover events
        this.element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Keyboard events
        this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.element.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Focus events
        this.element.addEventListener('focus', this.handleFocus.bind(this));
        this.element.addEventListener('blur', this.handleBlur.bind(this));
        
        this.logger.debug('Event listeners set up');
    }

    /**
     * Set up accessibility
     */
    setupAccessibility() {
        // Ensure button has proper role
        if (this.element.tagName !== 'BUTTON') {
            this.element.setAttribute('role', 'button');
            this.element.setAttribute('tabindex', '0');
        }
        
        // Set initial ARIA attributes
        this.element.setAttribute('aria-pressed', 'false');
        
        if (this.isDisabled) {
            this.element.setAttribute('aria-disabled', 'true');
        }
        
        this.logger.debug('Accessibility attributes set up');
    }

    /**
     * Handle click events
     */
    handleClick(event) {
        if (this.isDisabled || this.isLoading) {
            event.preventDefault();
            return;
        }
        
        // Create ripple effect
        if (this.options.ripple) {
            this.createRipple(event);
        }
        
        // Play audio feedback
        if (this.options.audio) {
            this.options.audio.playSFX('uiClick');
        }
        
        this.emit('button:click', event);
        this.logger.debug('Button clicked');
    }

    /**
     * Handle mouse down
     */
    handleMouseDown(event) {
        if (this.isDisabled || this.isLoading) {
            return;
        }
        
        this.isPressed = true;
        this.element.classList.add('button--pressed');
        this.element.setAttribute('aria-pressed', 'true');
        
        this.emit('button:press', event);
    }

    /**
     * Handle mouse up
     */
    handleMouseUp(event) {
        this.isPressed = false;
        this.element.classList.remove('button--pressed');
        this.element.setAttribute('aria-pressed', 'false');
        
        this.emit('button:release', event);
    }

    /**
     * Handle mouse enter
     */
    handleMouseEnter(event) {
        if (this.isDisabled || this.isLoading) {
            return;
        }
        
        this.isHovered = true;
        this.element.classList.add('button--hovered');
        
        this.emit('button:hover', event);
    }

    /**
     * Handle mouse leave
     */
    handleMouseLeave(event) {
        this.isHovered = false;
        this.element.classList.remove('button--hovered');
        
        this.emit('button:unhover', event);
    }

    /**
     * Handle key down
     */
    handleKeyDown(event) {
        if (this.isDisabled || this.isLoading) {
            return;
        }
        
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleMouseDown(event);
        }
    }

    /**
     * Handle key up
     */
    handleKeyUp(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleMouseUp(event);
            this.handleClick(event);
        }
    }

    /**
     * Handle focus
     */
    handleFocus(event) {
        this.element.classList.add('button--focused');
        this.emit('button:focus', event);
    }

    /**
     * Handle blur
     */
    handleBlur(event) {
        this.element.classList.remove('button--focused');
        this.emit('button:blur', event);
    }

    /**
     * Create ripple effect
     */
    createRipple(event) {
        const rect = this.element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('div');
        ripple.className = 'button__ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        this.rippleContainer.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.updateState();
        
        this.emit('button:loading-changed', loading);
        this.logger.debug(`Button loading state: ${loading}`);
    }

    /**
     * Set disabled state
     */
    setDisabled(disabled) {
        this.isDisabled = disabled;
        this.updateState();
        
        this.emit('button:disabled-changed', disabled);
        this.logger.debug(`Button disabled state: ${disabled}`);
    }

    /**
     * Set button text
     */
    setText(text) {
        if (this.content) {
            this.content.textContent = text;
        }
        
        this.emit('button:text-changed', text);
    }

    /**
     * Update button state
     */
    updateState() {
        // Update classes
        this.element.classList.toggle('button--loading', this.isLoading);
        this.element.classList.toggle('button--disabled', this.isDisabled);
        
        // Update attributes
        this.element.disabled = this.isDisabled || this.isLoading;
        
        if (this.isDisabled) {
            this.element.setAttribute('aria-disabled', 'true');
        } else {
            this.element.removeAttribute('aria-disabled');
        }
        
        // Update tabindex for non-button elements
        if (this.element.tagName !== 'BUTTON') {
            this.element.setAttribute('tabindex', this.isDisabled ? '-1' : '0');
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying Button...');
        
        // Remove event listeners
        this.element.removeEventListener('click', this.handleClick);
        this.element.removeEventListener('mousedown', this.handleMouseDown);
        this.element.removeEventListener('mouseup', this.handleMouseUp);
        this.element.removeEventListener('mouseenter', this.handleMouseEnter);
        this.element.removeEventListener('mouseleave', this.handleMouseLeave);
        this.element.removeEventListener('keydown', this.handleKeyDown);
        this.element.removeEventListener('keyup', this.handleKeyUp);
        this.element.removeEventListener('focus', this.handleFocus);
        this.element.removeEventListener('blur', this.handleBlur);
        
        // Clear references
        this.content = null;
        this.loader = null;
        this.rippleContainer = null;
        
        this.removeAllListeners();
        this.logger.info('Button destroyed');
    }
}

export default Button;