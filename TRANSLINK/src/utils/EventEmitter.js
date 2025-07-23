/**
 * TRANSLINK - Event Emitter
 * Enhanced event system for application-wide communication
 */

/**
 * EventEmitter class for handling events throughout the application
 */
export class EventEmitter {
    constructor() {
        this.events = new Map();
        this.maxListeners = 10;
    }

    /**
     * Add an event listener
     */
    on(event, listener, options = {}) {
        if (typeof listener !== 'function') {
            throw new TypeError('Listener must be a function');
        }

        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        const listeners = this.events.get(event);
        
        // Check max listeners
        if (listeners.length >= this.maxListeners) {
            console.warn(`Max listeners (${this.maxListeners}) exceeded for event: ${event}`);
        }

        const listenerObj = {
            fn: listener,
            once: options.once || false,
            priority: options.priority || 0
        };

        // Insert based on priority (higher priority first)
        const insertIndex = listeners.findIndex(l => l.priority < listenerObj.priority);
        if (insertIndex === -1) {
            listeners.push(listenerObj);
        } else {
            listeners.splice(insertIndex, 0, listenerObj);
        }

        return this;
    }

    /**
     * Add a one-time event listener
     */
    once(event, listener, options = {}) {
        return this.on(event, listener, { ...options, once: true });
    }

    /**
     * Remove an event listener
     */
    off(event, listener) {
        if (!this.events.has(event)) {
            return this;
        }

        const listeners = this.events.get(event);
        const index = listeners.findIndex(l => l.fn === listener);
        
        if (index !== -1) {
            listeners.splice(index, 1);
        }

        // Clean up empty event arrays
        if (listeners.length === 0) {
            this.events.delete(event);
        }

        return this;
    }

    /**
     * Remove all listeners for an event
     */
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
        return this;
    }

    /**
     * Emit an event
     */
    emit(event, ...args) {
        if (!this.events.has(event)) {
            return false;
        }

        const listeners = this.events.get(event).slice(); // Copy to avoid issues with modifications during iteration
        
        for (const listener of listeners) {
            try {
                listener.fn.apply(this, args);
                
                // Remove one-time listeners
                if (listener.once) {
                    this.off(event, listener.fn);
                }
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        }

        return true;
    }

    /**
     * Get listener count for an event
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0;
    }

    /**
     * Get all event names
     */
    eventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * Set max listeners
     */
    setMaxListeners(n) {
        this.maxListeners = n;
        return this;
    }
}