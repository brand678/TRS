/**
 * TRANSLINK - Logger Unit Tests
 */

import { Logger } from '../../src/utils/Logger.js';

describe('Logger', () => {
    let logger;
    let consoleSpy;
    
    beforeEach(() => {
        logger = new Logger('TestContext');
        consoleSpy = {
            log: jest.spyOn(console, 'log').mockImplementation(),
            warn: jest.spyOn(console, 'warn').mockImplementation(),
            error: jest.spyOn(console, 'error').mockImplementation(),
            trace: jest.spyOn(console, 'trace').mockImplementation()
        };
    });
    
    afterEach(() => {
        Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });
    
    describe('constructor', () => {
        test('should create logger with default context', () => {
            const defaultLogger = new Logger();
            expect(defaultLogger.context).toBe('App');
        });
        
        test('should create logger with custom context', () => {
            expect(logger.context).toBe('TestContext');
        });
        
        test('should detect debug mode from URL params', () => {
            // Mock URL search params
            delete window.location;
            window.location = { search: '?debug=true' };
            
            const debugLogger = new Logger('Debug');
            expect(debugLogger.isDebug).toBe(true);
        });
        
        test('should detect debug mode from localStorage', () => {
            localStorage.setItem('translink-debug', 'true');
            
            const debugLogger = new Logger('Debug');
            expect(debugLogger.isDebug).toBe(true);
            
            localStorage.removeItem('translink-debug');
        });
    });
    
    describe('logging methods', () => {
        test('should log info messages', () => {
            logger.info('Test message', 'extra', 'args');
            
            expect(consoleSpy.log).toHaveBeenCalledWith(
                expect.stringMatching(/\[\d{2}:\d{2}:\d{2}\] \[TestContext\] \[INFO\]/),
                'Test message',
                'extra',
                'args'
            );
        });
        
        test('should log warning messages', () => {
            logger.warn('Warning message');
            
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringMatching(/\[\d{2}:\d{2}:\d{2}\] \[TestContext\] \[WARN\]/),
                'Warning message'
            );
        });
        
        test('should log error messages', () => {
            logger.error('Error message');
            
            expect(consoleSpy.error).toHaveBeenCalledWith(
                expect.stringMatching(/\[\d{2}:\d{2}:\d{2}\] \[TestContext\] \[ERROR\]/),
                'Error message'
            );
        });
        
        test('should log debug messages only in debug mode', () => {
            // Non-debug mode
            logger.debug('Debug message');
            expect(consoleSpy.log).not.toHaveBeenCalled();
            
            // Debug mode
            logger.isDebug = true;
            logger.debug('Debug message');
            expect(consoleSpy.log).toHaveBeenCalledWith(
                expect.stringMatching(/\[\d{2}:\d{2}:\d{2}\] \[TestContext\] \[DEBUG\]/),
                'Debug message'
            );
        });
        
        test('should log trace messages only in debug mode', () => {
            // Non-debug mode
            logger.trace('Trace message');
            expect(consoleSpy.trace).not.toHaveBeenCalled();
            
            // Debug mode
            logger.isDebug = true;
            logger.trace('Trace message');
            expect(consoleSpy.trace).toHaveBeenCalledWith(
                expect.stringMatching(/\[\d{2}:\d{2}:\d{2}\] \[TestContext\] \[TRACE\]/),
                'Trace message'
            );
        });
    });
    
    describe('child logger', () => {
        test('should create child logger with extended context', () => {
            const childLogger = logger.child('ChildContext');
            
            expect(childLogger.context).toBe('TestContext:ChildContext');
            expect(childLogger).toBeInstanceOf(Logger);
        });
        
        test('should inherit debug mode from parent', () => {
            logger.isDebug = true;
            const childLogger = logger.child('ChildContext');
            
            expect(childLogger.isDebug).toBe(true);
        });
    });
    
    describe('message formatting', () => {
        test('should format messages with timestamp and context', () => {
            logger.info('Test message');
            
            const call = consoleSpy.log.mock.calls[0];
            const prefix = call[0];
            
            expect(prefix).toMatch(/^\[\d{2}:\d{2}:\d{2}\] \[TestContext\] \[INFO\]$/);
        });
        
        test('should handle multiple arguments', () => {
            const obj = { key: 'value' };
            const arr = [1, 2, 3];
            
            logger.info('Message', obj, arr);
            
            expect(consoleSpy.log).toHaveBeenCalledWith(
                expect.stringMatching(/\[INFO\]/),
                'Message',
                obj,
                arr
            );
        });
    });
});