/**
 * TRANSLINK - Modal Component
 * Reusable modal component with animations and accessibility
 */

import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * Modal - Reusable modal component
 */
export class Modal extends EventEmitter {
    constructor(element, options = {}) {
        super();
        
        this.logger = new Logger('Modal');
        this.element = element;
        this.options = {
            closeOnOverlay: true,
            closeOnEscape: true,
            trapFocus: true,
            audio: null,
            ...options
        };
        
        // State
        this.isOpen = false;
        this.isAnimating = false;
        
        // Elements
        this.overlay = null;
        this.content = null;
        this.closeButton = null;
        
        // Focus management
        this.previousFocus = null;
        this.focusableElements = [];
        
        this.logger.info('Modal created');
    }

    /**
     * Initialize modal
     */
    init() {
        try {
            this.logger.debug('Initializing modal...');
            
            // Set up structure
            this.setupStructure();
            
            // Set up styling
            this.setupStyling();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up accessibility
            this.setupAccessibility();
            
            // Set initial state
            this.updateState();
            
            this.emit('modal:initialized');
            this.logger.debug('Modal initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize modal:', error);
            throw error;
        }
    }

    /**
     * Set up modal structure
     */
    setupStructure() {
        // Ensure modal has proper structure
        if (!this.element.querySelector('.modal__overlay')) {
            const originalContent = this.element.innerHTML;
            
            this.element.innerHTML = `
                <div class="modal__overlay">
                    <div class="modal__content">
                        <button class="modal__close" aria-label="Close modal">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <div class="modal__body">
                            ${originalContent}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Get references
        this.overlay = this.element.querySelector('.modal__overlay');
        this.content = this.element.querySelector('.modal__content');
        this.closeButton = this.element.querySelector('.modal__close');
        this.body = this.element.querySelector('.modal__body');
        
        this.logger.debug('Modal structure set up');
    }

    /**
     * Set up modal styling
     */
    setupStyling() {
        // Add base classes
        this.element.classList.add('modal');
        
        // Add CSS if not already present
        this.addModalStyles();
        
        this.logger.debug('Modal styling set up');
    }

    /**
     * Add modal CSS styles
     */
    addModalStyles() {
        if (document.getElementById('modal-component-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'modal-component-styles';
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1000;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal--open {
                display: flex;
                opacity: 1;
            }
            
            .modal__overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            
            .modal__content {
                position: relative;
                background: var(--color-background);
                border: 1px solid var(--color-menuBorder);
                border-radius: 1rem;
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .modal--open .modal__content {
                transform: scale(1);
            }
            
            .modal__close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                z-index: 10;
                background: rgba(0, 0, 0, 0.5);
                border: none;
                border-radius: 50%;
                width: 2.5rem;
                height: 2.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .modal__close:hover {
                background: rgba(0, 0, 0, 0.8);
                transform: scale(1.1);
            }
            
            .modal__close:focus-visible {
                outline: 2px solid var(--color-accent);
                outline-offset: 2px;
            }
            
            .modal__body {
                padding: 2rem;
                overflow-y: auto;
                max-height: calc(90vh - 4rem);
            }
            
            @media (max-width: 768px) {
                .modal__overlay {
                    padding: 1rem;
                }
                
                .modal__content {
                    max-width: 100%;
                    max-height: 100%;
                    border-radius: 0.5rem;
                }
                
                .modal__body {
                    padding: 1.5rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Close button
        if (this.closeButton) {
            this.closeButton.addEventListener('click', this.close.bind(this));
        }
        
        // Overlay click
        if (this.options.closeOnOverlay && this.overlay) {
            this.overlay.addEventListener('click', (event) => {
                if (event.target === this.overlay) {
                    this.close();
                }
            });
        }
        
        // Escape key
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', this.handleEscapeKey.bind(this));
        }
        
        // Focus trap
        if (this.options.trapFocus) {
            document.addEventListener('keydown', this.handleFocusTrap.bind(this));
        }
        
        this.logger.debug('Event listeners set up');
    }

    /**
     * Set up accessibility
     */
    setupAccessibility() {
        // Modal attributes
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');
        this.element.setAttribute('aria-hidden', 'true');
        
        // Content attributes
        if (this.content) {
            this.content.setAttribute('role', 'document');
        }
        
        this.logger.debug('Accessibility attributes set up');
    }

    /**
     * Handle escape key
     */
    handleEscapeKey(event) {
        if (event.key === 'Escape' && this.isOpen) {
            this.close();
        }
    }

    /**
     * Handle focus trap
     */
    handleFocusTrap(event) {
        if (!this.isOpen || event.key !== 'Tab') {
            return;
        }
        
        const focusableElements = this.getFocusableElements();
        if (focusableElements.length === 0) {
            return;
        }
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }

    /**
     * Get focusable elements within modal
     */
    getFocusableElements() {
        const selectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        return Array.from(this.element.querySelectorAll(selectors.join(', ')))
            .filter(element => {
                return element.offsetParent !== null && 
                       !element.hasAttribute('disabled') &&
                       element.getAttribute('tabindex') !== '-1';
            });
    }

    /**
     * Open modal
     */
    async open() {
        if (this.isOpen || this.isAnimating) {
            return;
        }
        
        this.logger.debug('Opening modal');
        this.isAnimating = true;
        
        try {
            // Store previous focus
            this.previousFocus = document.activeElement;
            
            // Update state
            this.isOpen = true;
            this.updateState();
            
            // Add to DOM and show
            this.element.style.display = 'flex';
            
            // Force reflow
            this.element.offsetHeight;
            
            // Add open class for animation
            this.element.classList.add('modal--open');
            
            // Add body class to prevent scrolling
            document.body.classList.add('modal-open');
            
            // Focus first focusable element
            setTimeout(() => {
                const focusableElements = this.getFocusableElements();
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            }, 100);
            
            // Play audio feedback
            if (this.options.audio) {
                this.options.audio.playSFX('uiModalOpen');
            }
            
            this.emit('modal:opened');
            
        } catch (error) {
            this.logger.error('Error opening modal:', error);
        } finally {
            this.isAnimating = false;
        }
    }

    /**
     * Close modal
     */
    async close() {
        if (!this.isOpen || this.isAnimating) {
            return;
        }
        
        this.logger.debug('Closing modal');
        this.isAnimating = true;
        
        try {
            // Update state
            this.isOpen = false;
            this.updateState();
            
            // Remove open class for animation
            this.element.classList.remove('modal--open');
            
            // Remove body class
            document.body.classList.remove('modal-open');
            
            // Hide after animation
            setTimeout(() => {
                this.element.style.display = 'none';
                
                // Restore previous focus
                if (this.previousFocus) {
                    this.previousFocus.focus();
                    this.previousFocus = null;
                }
            }, 300);
            
            // Play audio feedback
            if (this.options.audio) {
                this.options.audio.playSFX('uiModalClose');
            }
            
            this.emit('modal:closed');
            
        } catch (error) {
            this.logger.error('Error closing modal:', error);
        } finally {
            this.isAnimating = false;
        }
    }

    /**
     * Toggle modal open/close
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Set modal content
     */
    setContent(content) {
        if (this.body) {
            if (typeof content === 'string') {
                this.body.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                this.body.innerHTML = '';
                this.body.appendChild(content);
            }
        }
        
        this.emit('modal:content-changed', content);
    }

    /**
     * Update modal state
     */
    updateState() {
        // Update ARIA attributes
        this.element.setAttribute('aria-hidden', (!this.isOpen).toString());
        
        // Update classes
        this.element.classList.toggle('modal--open', this.isOpen);
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying Modal...');
        
        // Close modal if open
        if (this.isOpen) {
            this.close();
        }
        
        // Remove event listeners
        if (this.closeButton) {
            this.closeButton.removeEventListener('click', this.close);
        }
        
        document.removeEventListener('keydown', this.handleEscapeKey);
        document.removeEventListener('keydown', this.handleFocusTrap);
        
        // Remove body class
        document.body.classList.remove('modal-open');
        
        // Clear references
        this.overlay = null;
        this.content = null;
        this.closeButton = null;
        this.body = null;
        
        this.removeAllListeners();
        this.logger.info('Modal destroyed');
    }
}

export default Modal;