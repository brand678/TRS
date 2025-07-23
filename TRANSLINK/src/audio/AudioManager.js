/**
 * TRANSLINK - Audio Manager
 * Centralized audio system management
 */

import * as THREE from 'three'
import { EventEmitter } from '../utils/EventEmitter.js'
import { Logger } from '../utils/Logger.js'

/**
 * AudioManager - Handles all audio functionality
 */
export class AudioManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = new Logger('AudioManager');
        this.options = {
            debug: false,
            basePath: '/assets/audio',
            ...options
        };
        
        // Audio context and listener
        this.listener = null;
        this.context = null;
        
        // Audio assets
        this.sounds = new Map();
        this.music = new Map();
        
        // State
        this.isInitialized = false;
        this.isEnabled = false;
        this.masterVolume = 0.2;
        this.musicVolume = 1.0;
        this.sfxVolume = 1.0;
        
        // Default volumes for specific sounds
        this.defaultVolumes = {
            synthLoop: 1.0,
            powerLoop: 0.46,
            uiAskTranslinkOpen: 1.0,
            uiMenuClose: 0.55,
            uiMenuOpen: 0.55,
            uiQuestionSend: 1.0,
            uiReply: 0.8,
        };
        
        this.logger.info('AudioManager created');
    }

    /**
     * Initialize audio system
     */
    async init() {
        try {
            this.logger.info('Initializing AudioManager...');
            
            // Set up audio listener
            this.setupAudioListener();
            
            // Load audio assets
            await this.loadAudioAssets();
            
            // Set up user interaction handler
            this.setupUserInteraction();
            
            this.isInitialized = true;
            this.emit('audio:initialized');
            
            this.logger.info('AudioManager initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize AudioManager:', error);
            throw error;
        }
    }

    /**
     * Set up Three.js audio listener
     */
    setupAudioListener() {
        this.listener = new THREE.AudioListener();
        this.context = this.listener.context;
        
        // Set master volume
        this.listener.setMasterVolume(0); // Start muted until user interaction
        
        this.logger.info('Audio listener created');
    }

    /**
     * Load audio assets
     */
    async loadAudioAssets() {
        this.logger.info('Loading audio assets...');
        
        const audioLoader = new THREE.AudioLoader();
        
        const audioAssets = [
            // Background music
            { name: 'synthLoop', path: 'AETHER_2.5_synthloop-03.mp3', type: 'music' },
            { name: 'powerLoop', path: 'AETHER_2.5_powerloop-02.mp3', type: 'music' },
            
            // UI sounds
            { name: 'uiAskTranslinkOpen', path: 'AETHER_2.5_UI_ask-aether-open-03.mp3', type: 'sfx' },
            { name: 'uiMenuClose', path: 'AETHER_2.5_UI_menu-close-03.mp3', type: 'sfx' },
            { name: 'uiMenuOpen', path: 'AETHER_2.5_UI_menu-open-03.mp3', type: 'sfx' },
            { name: 'uiQuestionSend', path: 'AETHER_2.5_UI_question-send-03.mp3', type: 'sfx' },
            { name: 'uiReply', path: 'AETHER_2.5_UI_reply-03.mp3', type: 'sfx' }
        ];
        
        const loadPromises = audioAssets.map(asset => this.loadAudioAsset(audioLoader, asset));
        
        await Promise.all(loadPromises);
        
        this.logger.info(`Loaded ${audioAssets.length} audio assets`);
    }

    /**
     * Load a single audio asset
     */
    async loadAudioAsset(loader, assetConfig) {
        const { name, path, type } = assetConfig;
        const fullPath = `${this.options.basePath}/${path}`;
        
        return new Promise((resolve, reject) => {
            loader.load(
                fullPath,
                (buffer) => {
                    // Create audio object
                    const audio = new THREE.Audio(this.listener);
                    audio.setBuffer(buffer);
                    
                    // Configure based on type
                    if (type === 'music') {
                        audio.setLoop(true);
                        audio.setVolume(this.defaultVolumes[name] || this.musicVolume);
                        this.music.set(name, audio);
                    } else {
                        audio.setLoop(false);
                        audio.setVolume(this.defaultVolumes[name] || this.sfxVolume);
                        this.sounds.set(name, audio);
                    }
                    
                    this.logger.debug(`Loaded ${type}: ${name}`);
                    resolve(audio);
                },
                undefined,
                (error) => {
                    this.logger.error(`Failed to load ${type} ${name}:`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Set up user interaction handler for audio context
     */
    setupUserInteraction() {
        const enableAudio = () => {
            if (this.context && this.context.state === 'suspended') {
                this.context.resume().then(() => {
                    this.logger.info('Audio context resumed');
                    this.emit('audio:context-resumed');
                });
            }
        };
        
        // Listen for first user interaction
        const interactionEvents = ['click', 'touchstart', 'keydown'];
        const handleFirstInteraction = () => {
            enableAudio();
            
            // Remove listeners after first interaction
            interactionEvents.forEach(event => {
                document.removeEventListener(event, handleFirstInteraction);
            });
            
            this.emit('audio:first-interaction');
        };
        
        interactionEvents.forEach(event => {
            document.addEventListener(event, handleFirstInteraction, { once: true });
        });
    }

    /**
     * Enable audio system
     */
    enable() {
        if (!this.isInitialized) {
            this.logger.warn('Audio system not initialized');
            return;
        }
        
        this.isEnabled = true;
        this.listener.setMasterVolume(this.masterVolume);
        
        // Start background music
        this.startBackgroundMusic();
        
        this.emit('audio:enabled');
        this.logger.info('Audio system enabled');
    }

    /**
     * Disable audio system
     */
    disable() {
        this.isEnabled = false;
        this.listener.setMasterVolume(0);
        
        // Stop all audio
        this.stopAll();
        
        this.emit('audio:disabled');
        this.logger.info('Audio system disabled');
    }

    /**
     * Toggle audio system
     */
    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
        
        return this.isEnabled;
    }

    /**
     * Start background music
     */
    startBackgroundMusic() {
        const synthLoop = this.music.get('synthLoop');
        if (synthLoop && !synthLoop.isPlaying) {
            synthLoop.play();
            this.logger.debug('Started background music');
        }
    }

    /**
     * Play sound effect
     */
    playSFX(name, volume = null) {
        if (!this.isEnabled) {
            return;
        }
        
        const sound = this.sounds.get(name);
        if (!sound) {
            this.logger.warn(`Sound not found: ${name}`);
            return;
        }
        
        // Stop if already playing
        if (sound.isPlaying) {
            sound.stop();
        }
        
        // Set volume if specified
        if (volume !== null) {
            sound.setVolume(volume * this.sfxVolume);
        } else {
            sound.setVolume(this.defaultVolumes[name] || this.sfxVolume);
        }
        
        sound.play();
        this.logger.debug(`Played SFX: ${name}`);
    }

    /**
     * Play music
     */
    playMusic(name, volume = null) {
        if (!this.isEnabled) {
            return;
        }
        
        const music = this.music.get(name);
        if (!music) {
            this.logger.warn(`Music not found: ${name}`);
            return;
        }
        
        // Set volume if specified
        if (volume !== null) {
            music.setVolume(volume * this.musicVolume);
        }
        
        if (!music.isPlaying) {
            music.play();
            this.logger.debug(`Started music: ${name}`);
        }
    }

    /**
     * Stop music
     */
    stopMusic(name) {
        const music = this.music.get(name);
        if (music && music.isPlaying) {
            music.stop();
            this.logger.debug(`Stopped music: ${name}`);
        }
    }

    /**
     * Stop all audio
     */
    stopAll() {
        // Stop all music
        for (const [name, music] of this.music) {
            if (music.isPlaying) {
                music.stop();
            }
        }
        
        // Stop all sounds
        for (const [name, sound] of this.sounds) {
            if (sound.isPlaying) {
                sound.stop();
            }
        }
        
        this.logger.debug('Stopped all audio');
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        if (this.listener) {
            this.listener.setMasterVolume(this.isEnabled ? this.masterVolume : 0);
        }
        
        this.emit('audio:volume-changed', { type: 'master', volume: this.masterVolume });
    }

    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        // Update all music volumes
        for (const [name, music] of this.music) {
            const defaultVol = this.defaultVolumes[name] || 1.0;
            music.setVolume(defaultVol * this.musicVolume);
        }
        
        this.emit('audio:volume-changed', { type: 'music', volume: this.musicVolume });
    }

    /**
     * Set SFX volume
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.emit('audio:volume-changed', { type: 'sfx', volume: this.sfxVolume });
    }

    /**
     * Get audio state
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            isEnabled: this.isEnabled,
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            contextState: this.context ? this.context.state : 'unknown'
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.logger.info('Destroying AudioManager...');
        
        // Stop all audio
        this.stopAll();
        
        // Dispose of audio objects
        for (const [name, sound] of this.sounds) {
            if (sound.buffer) {
                // Note: AudioBuffer doesn't have a dispose method
            }
        }
        
        for (const [name, music] of this.music) {
            if (music.buffer) {
                // Note: AudioBuffer doesn't have a dispose method
            }
        }
        
        this.sounds.clear();
        this.music.clear();
        
        this.removeAllListeners();
        this.isInitialized = false;
        
        this.logger.info('AudioManager destroyed');
    }
}