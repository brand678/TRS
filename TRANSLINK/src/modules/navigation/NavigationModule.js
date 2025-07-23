/**
 * TRANSLINK - Navigation Module
 * Handles main navigation menu functionality
 */

import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * NavigationModule - Main navigation menu management
 */
export class NavigationModule extends EventEmitter {
    constructor(element, options = {}) {
        super();
        
        this.logger = new Logger('NavigationModule');
        this.element = element;
        this.options = {
            webgl: null,
            audio: null,
            themeSystem: null,
            debug: false,
            ...options
        };
        
        // Navigation elements
        this.menuToggle = null;
        this.menuList = null;
        this.menuItems = [];
        this.menuLinks = [];
        
        // State
        this.isOpen = false;
        this.isAnimating = false;
        
        this.logger.info('NavigationModule created');
    }

    /**
     * Initialize navigation module
     */
    async init() {
        try {
            this.logger.info('Initializing NavigationModule...');
            
            // Find navigation elements
            this.findElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up animations
            this.setupAnimations();
            
            // Set up accessibility
            this.setupAccessibility();
            
            this.emit('navigation:initialized');
            this.logger.info('NavigationModule initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize NavigationModule:', error);
            throw error;
        }
    }

    /**
     * Find navigation elements
     */
    findElements() {
        // Find menu toggle button
        this.menuToggle = document.querySelector('[data-menu-toggle]');
        if (!this.menuToggle) {
            this.logger.warn('Menu toggle button not found');
        }
        
        // Find menu list
        this.menuList = this.element.querySelector('.navigation__menu-list');
        if (!this.menuList) {
            this.menuList = this.element.querySelector('ul');
        }
        
        // Find menu items and links
        if (this.menuList) {
            this.menuItems = Array.from(this.menuList.querySelectorAll('li'));
            this.menuLinks = Array.from(this.menuList.querySelectorAll('a'));
        }
        
        this.logger.debug(`Found ${this.menuItems.length} menu items`);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Menu toggle click
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', this.handleToggleClick.bind(this));
            this.menuToggle.addEventListener('keydown', this.handleToggleKeydown.bind(this));
        }
        
        // Menu item clicks
        this.menuLinks.forEach(link => {
            link.addEventListener('click', this.handleLinkClick.bind(this));
        });
        
        // Close menu on escape
        document.addEventListener('keydown', this.handleEscapeKey.bind(this));
        
        // Close menu on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        
        this.logger.debug('Event listeners set up');
    }

    /**
     * Set up animations
     */
    setupAnimations() {
        // Set initial states
        if (this.menuList) {
            this.menuList.style.transform = 'translateY(-100%)';
            this.menuList.style.opacity = '0';
        }
        
        this.menuItems.forEach((item, index) => {
            item.style.transform = 'translateY(-20px)';
            item.style.opacity = '0';
        });
        
        this.logger.debug('Animations set up');
    }

    /**
     * Set up accessibility
     */
    setupAccessibility() {
        if (this.menuToggle) {
            this.menuToggle.setAttribute('aria-expanded', 'false');
            this.menuToggle.setAttribute('aria-controls', 'main-navigation');
        }
        
        if (this.element) {
            this.element.setAttribute('role', 'navigation');
            this.element.setAttribute('aria-label', 'Main navigation');
        }
        
        if (this.menuList) {
            this.menuList.setAttribute('id', 'main-navigation');
        }
        
        this.logger.debug('Accessibility attributes set up');
    }

    /**
     * Handle menu toggle click
     */
    handleToggleClick(event) {
        event.preventDefault();
        this.toggle();
    }

    /**
     * Handle menu toggle keydown
     */
    handleToggleKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.toggle();
        }
    }

    /**
     * Handle menu link click
     */
    handleLinkClick(event) {
        const link = event.currentTarget;
        const href = link.getAttribute('href');
        
        // Check if it's an internal link
        if (href && href.startsWith('/')) {
            // Let the router handle internal navigation
            this.close();
        }
        
        // Play audio feedback
        if (this.options.audio) {
            this.options.audio.playSFX('uiMenuClose');
        }
        
        this.emit('navigation:link-clicked', { link, href });
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
     * Handle outside click
     */
    handleOutsideClick(event) {
        if (this.isOpen && !this.element.contains(event.target)) {
            this.close();
        }
    }

    /**
     * Toggle menu open/close
     */
    toggle() {
        if (this.isAnimating) {
            return;
        }
        
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open menu
     */
    async open() {
        if (this.isOpen || this.isAnimating) {
            return;
        }
        
        this.logger.debug('Opening navigation menu');
        this.isAnimating = true;
        
        try {
            // Update state
            this.isOpen = true;
            
            // Update accessibility
            if (this.menuToggle) {
                this.menuToggle.setAttribute('aria-expanded', 'true');
            }
            
            // Add CSS class
            this.element.classList.add('navigation--open');
            document.body.classList.add('navigation-open');
            
            // Animate menu list
            if (this.menuList) {
                await this.animateElement(this.menuList, {
                    transform: 'translateY(0%)',
                    opacity: '1'
                }, 300);
            }
            
            // Animate menu items
            const itemPromises = this.menuItems.map((item, index) => {
                return this.animateElement(item, {
                    transform: 'translateY(0px)',
                    opacity: '1'
                }, 200, index * 50);
            });
            
            await Promise.all(itemPromises);
            
            // Play audio feedback
            if (this.options.audio) {
                this.options.audio.playSFX('uiMenuOpen');
            }
            
            this.emit('navigation:opened');
            
        } catch (error) {
            this.logger.error('Error opening navigation:', error);
        } finally {
            this.isAnimating = false;
        }
    }

    /**
     * Close menu
     */
    async close() {
        if (!this.isOpen || this.isAnimating) {
            return;
        }
        
        this.logger.debug('Closing navigation menu');
        this.isAnimating = true;
        
        try {
            // Update state
            this.isOpen = false;
            
            // Update accessibility
            if (this.menuToggle) {
                this.menuToggle.setAttribute('aria-expanded', 'false');
            }
            
            // Animate menu items out
            const itemPromises = this.menuItems.map((item, index) => {
                return this.animateElement(item, {
                    transform: 'translateY(-20px)',
                    opacity: '0'
                }, 150, index * 25);
            });
            
            await Promise.all(itemPromises);
            
            // Animate menu list out
            if (this.menuList) {
                await this.animateElement(this.menuList, {
                    transform: 'translateY(-100%)',
                    opacity: '0'
                }, 250);
            }
            
            // Remove CSS classes
            this.element.classList.remove('navigation--open');
            document.body.classList.remove('navigation-open');
            
            // Play audio feedback
            if (this.options.audio) {
                this.options.audio.playSFX('uiMenuClose');
            }
            
            this.emit('navigation:closed');
            
        } catch (error) {
            this.logger.error('Error closing navigation:', error);
        } finally {
            this.isAnimating = false;
        }
    }

    /**
     * Animate element with CSS transitions
     */
    animateElement(element, styles, duration = 300, delay = 0) {
        return new Promise((resolve) => {
            // Set transition
            element.style.transition = `all ${duration}ms ease-out`;
            
            // Apply delay if specified
            if (delay > 0) {
                setTimeout(() => {
                    Object.assign(element.style, styles);
                }, delay);
                
                setTimeout(resolve, duration + delay);
            } else {
                Object.assign(element.style, styles);
                setTimeout(resolve, duration);
            }
        });
    }

    /**
     * Handle page transition
     */
    async onPageTransition(toPage, fromPage) {
        this.logger.debug(`Navigation page transition: ${fromPage} → ${toPage}`);
        
        // Close menu if open
        if (this.isOpen) {
            await this.close();
        }
        
        // Update active menu item
        this.updateActiveMenuItem(toPage);
        
        this.emit('navigation:page-transition', { toPage, fromPage });
    }

    /**
     * Update active menu item based on current page
     */
    updateActiveMenuItem(currentPage) {
        // Remove active class from all items
        this.menuLinks.forEach(link => {
            link.classList.remove('navigation__link--active');
        });
        
        // Add active class to current page link
        const activeLink = this.menuLinks.find(link => {
            const href = link.getAttribute('href');
            return href === currentPage || (currentPage === 'homepage' && href === '/');
        });
        
        if (activeLink) {
            activeLink.classList.add('navigation__link--active');
        }
        
        this.logger.debug(`Active menu item updated for page: ${currentPage}`);
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying NavigationModule...');
        
        // Remove event listeners
        if (this.menuToggle) {
            this.menuToggle.removeEventListener('click', this.handleToggleClick);
            this.menuToggle.removeEventListener('keydown', this.handleToggleKeydown);
        }
        
        this.menuLinks.forEach(link => {
            link.removeEventListener('click', this.handleLinkClick);
        });
        
        document.removeEventListener('keydown', this.handleEscapeKey);
        document.removeEventListener('click', this.handleOutsideClick);
        
        // Remove CSS classes
        this.element.classList.remove('navigation--open');
        document.body.classList.remove('navigation-open');
        
        // Clear references
        this.menuToggle = null;
        this.menuList = null;
        this.menuItems = [];
        this.menuLinks = [];
        
        this.removeAllListeners();
        this.logger.info('NavigationModule destroyed');
    }
}

export default NavigationModule;