/**
 * TRANSLINK - Logger Utility
 * Centralized logging system with levels and formatting
 */

/**
 * Logger class for consistent logging across the application
 */
export class Logger {
    constructor(context = 'App') {
        this.context = context;
        this.isDebug = this.checkDebugMode();
    }

    /**
     * Check if debug mode is enabled
     */
    checkDebugMode() {
        return new URLSearchParams(window.location.search).has('debug') || 
               localStorage.getItem('translink-debug') === 'true';
    }

    /**
     * Format log message with context and timestamp
     */
    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = `[${timestamp}] [${this.context}] [${level.toUpperCase()}]`;
        
        return [prefix, message, ...args];
    }

    /**
     * Log info message
     */
    info(message, ...args) {
        console.log(...this.formatMessage('info', message, ...args));
    }

    /**
     * Log warning message
     */
    warn(message, ...args) {
        console.warn(...this.formatMessage('warn', message, ...args));
    }

    /**
     * Log error message
     */
    error(message, ...args) {
        console.error(...this.formatMessage('error', message, ...args));
    }

    /**
     * Log debug message (only in debug mode)
     */
    debug(message, ...args) {
        if (this.isDebug) {
            console.log(...this.formatMessage('debug', message, ...args));
        }
    }

    /**
     * Log trace message (only in debug mode)
     */
    trace(message, ...args) {
        if (this.isDebug) {
            console.trace(...this.formatMessage('trace', message, ...args));
        }
    }

    /**
     * Create a child logger with extended context
     */
    child(childContext) {
        return new Logger(`${this.context}:${childContext}`);
    }
}