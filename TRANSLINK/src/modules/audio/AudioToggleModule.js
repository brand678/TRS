/**
 * TRANSLINK - Audio Toggle Module
 * Handles audio on/off toggle with visual feedback
 */

import { EventEmitter } from '../../utils/EventEmitter.js'
import { Logger } from '../../utils/Logger.js'

/**
 * AudioToggleModule - Audio control toggle with wave animation
 */
export class AudioToggleModule extends EventEmitter {
    constructor(element, options = {}) {
        super();
        
        this.logger = new Logger('AudioToggleModule');
        this.element = element;
        this.options = {
            webgl: null,
            audio: null,
            themeSystem: null,
            debug: false,
            ...options
        };
        
        // Wave animation settings
        this.waveConfig = {
            points: 25,
            amplitudeOn: 2.5,
            amplitudeOff: 0,
            length: 2,
            speedOn: 0.1,
            speedOff: 0,
            offset: 8
        };
        
        // Animation state
        this.wave = {
            amplitude: this.waveConfig.amplitudeOff,
            targetAmplitude: this.waveConfig.amplitudeOff,
            speed: this.waveConfig.speedOff,
            targetSpeed: this.waveConfig.speedOff,
            points: [],
            time: 0
        };
        
        // State
        this.isEnabled = false;
        this.isAnimating = false;
        this.animationId = null;
        
        this.logger.info('AudioToggleModule created');
    }

    /**
     * Initialize audio toggle module
     */
    async init() {
        try {
            this.logger.info('Initializing AudioToggleModule...');
            
            // Find elements
            this.findElements();
            
            // Set up wave animation
            this.setupWaveAnimation();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up accessibility
            this.setupAccessibility();
            
            this.emit('audio-toggle:initialized');
            this.logger.info('AudioToggleModule initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize AudioToggleModule:', error);
            throw error;
        }
    }

    /**
     * Find toggle elements
     */
    findElements() {
        this.toggleButton = this.element;
        this.waveIcon = this.element.querySelector('.audio-toggle__wave');
        this.wavePath = this.element.querySelector('.audio-toggle__wave path');
        
        if (!this.wavePath) {
            // Create wave SVG if it doesn't exist
            this.createWaveSVG();
        }
        
        this.logger.debug('Audio toggle elements found');
    }

    /**
     * Create wave SVG element
     */
    createWaveSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'audio-toggle__wave');
        svg.setAttribute('viewBox', '0 0 25 16');
        svg.setAttribute('width', '25');
        svg.setAttribute('height', '16');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        
        svg.appendChild(path);
        this.element.appendChild(svg);
        
        this.waveIcon = svg;
        this.wavePath = path;
        
        this.logger.debug('Wave SVG created');
    }

    /**
     * Set up wave animation
     */
    setupWaveAnimation() {
        // Initialize wave points
        for (let i = 0; i <= this.waveConfig.points; i++) {
            this.wave.points.push(i);
        }
        
        // Start animation loop
        this.startWaveAnimation();
        
        this.logger.debug('Wave animation set up');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Toggle click
        this.toggleButton.addEventListener('click', this.handleToggleClick.bind(this));
        
        // Keyboard support
        this.toggleButton.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Audio system events
        if (this.options.audio) {
            this.options.audio.on('audio:enabled', this.handleAudioEnabled.bind(this));
            this.options.audio.on('audio:disabled', this.handleAudioDisabled.bind(this));
        }
        
        this.logger.debug('Event listeners set up');
    }

    /**
     * Set up accessibility
     */
    setupAccessibility() {
        this.toggleButton.setAttribute('role', 'button');
        this.toggleButton.setAttribute('aria-label', 'Toggle audio');
        this.toggleButton.setAttribute('aria-pressed', 'false');
        this.toggleButton.setAttribute('tabindex', '0');
        
        this.logger.debug('Accessibility attributes set up');
    }

    /**
     * Handle toggle click
     */
    handleToggleClick(event) {
        event.preventDefault();
        this.toggle();
    }

    /**
     * Handle keydown events
     */
    handleKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.toggle();
        }
    }

    /**
     * Handle audio enabled event
     */
    handleAudioEnabled() {
        this.isEnabled = true;
        this.updateVisualState();
        this.logger.debug('Audio enabled');
    }

    /**
     * Handle audio disabled event
     */
    handleAudioDisabled() {
        this.isEnabled = false;
        this.updateVisualState();
        this.logger.debug('Audio disabled');
    }

    /**
     * Toggle audio on/off
     */
    toggle() {
        if (this.isAnimating) {
            return;
        }
        
        this.logger.debug('Toggling audio');
        
        if (this.options.audio) {
            const newState = this.options.audio.toggle();
            this.isEnabled = newState;
        } else {
            this.isEnabled = !this.isEnabled;
        }
        
        this.updateVisualState();
        this.emit('audio-toggle:changed', this.isEnabled);
    }

    /**
     * Update visual state
     */
    updateVisualState() {
        // Update button state
        this.toggleButton.classList.toggle('audio-toggle--enabled', this.isEnabled);
        this.toggleButton.setAttribute('aria-pressed', this.isEnabled.toString());
        
        // Update wave animation
        if (this.isEnabled) {
            this.wave.targetAmplitude = this.waveConfig.amplitudeOn;
            this.wave.targetSpeed = this.waveConfig.speedOn;
        } else {
            this.wave.targetAmplitude = this.waveConfig.amplitudeOff;
            this.wave.targetSpeed = this.waveConfig.speedOff;
        }
        
        this.logger.debug(`Visual state updated: ${this.isEnabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Start wave animation
     */
    startWaveAnimation() {
        if (this.animationId) {
            return;
        }
        
        const animate = () => {
            this.updateWave();
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
        this.logger.debug('Wave animation started');
    }

    /**
     * Stop wave animation
     */
    stopWaveAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.logger.debug('Wave animation stopped');
    }

    /**
     * Update wave animation
     */
    updateWave() {
        // Smooth transitions
        this.wave.amplitude += (this.wave.targetAmplitude - this.wave.amplitude) * 0.05;
        this.wave.speed += (this.wave.targetSpeed - this.wave.speed) * 0.05;
        
        // Generate wave points
        const points = this.wave.points.map((x) => {
            const y = this.waveConfig.offset + 
                     this.wave.amplitude * Math.sin((x + this.wave.time) / this.waveConfig.length);
            return [x, y];
        });
        
        // Create SVG path
        const pathData = `M${points.map(([x, y]) => `${x},${y}`).join(' L')}`;
        
        if (this.wavePath) {
            this.wavePath.setAttribute('d', pathData);
        }
        
        // Update time
        this.wave.time += this.wave.speed;
        
        // Stop animation if wave is inactive and stable
        if (this.wave.amplitude < 0.01 && this.wave.speed < 0.01) {
            // Keep minimal animation for visual feedback
        }
    }

    /**
     * Handle page transition
     */
    async onPageTransition(toPage, fromPage) {
        this.logger.debug(`Audio toggle page transition: ${fromPage} → ${toPage}`);
        
        // Maintain audio state across page transitions
        this.emit('audio-toggle:page-transition', { toPage, fromPage });
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying AudioToggleModule...');
        
        // Stop animation
        this.stopWaveAnimation();
        
        // Remove event listeners
        this.toggleButton.removeEventListener('click', this.handleToggleClick);
        this.toggleButton.removeEventListener('keydown', this.handleKeydown);
        
        if (this.options.audio) {
            this.options.audio.off('audio:enabled', this.handleAudioEnabled);
            this.options.audio.off('audio:disabled', this.handleAudioDisabled);
        }
        
        // Clear references
        this.toggleButton = null;
        this.waveIcon = null;
        this.wavePath = null;
        
        this.removeAllListeners();
        this.logger.info('AudioToggleModule destroyed');
    }
}

export default AudioToggleModule;