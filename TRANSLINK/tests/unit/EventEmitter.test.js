/**
 * TRANSLINK - EventEmitter Unit Tests
 */

import { EventEmitter } from '../../src/utils/EventEmitter.js';

describe('EventEmitter', () => {
    let emitter;
    
    beforeEach(() => {
        emitter = new EventEmitter();
    });
    
    describe('constructor', () => {
        test('should initialize with empty events map', () => {
            expect(emitter.events).toBeInstanceOf(Map);
            expect(emitter.events.size).toBe(0);
        });
        
        test('should set default max listeners', () => {
            expect(emitter.maxListeners).toBe(10);
        });
    });
    
    describe('on method', () => {
        test('should add event listener', () => {
            const listener = jest.fn();
            
            emitter.on('test', listener);
            
            expect(emitter.events.has('test')).toBe(true);
            expect(emitter.events.get('test')).toHaveLength(1);
        });
        
        test('should add multiple listeners for same event', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            
            emitter.on('test', listener1);
            emitter.on('test', listener2);
            
            expect(emitter.events.get('test')).toHaveLength(2);
        });
        
        test('should respect priority ordering', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            const listener3 = jest.fn();
            
            emitter.on('test', listener1, { priority: 1 });
            emitter.on('test', listener2, { priority: 5 });
            emitter.on('test', listener3, { priority: 3 });
            
            const listeners = emitter.events.get('test');
            expect(listeners[0].fn).toBe(listener2); // priority 5
            expect(listeners[1].fn).toBe(listener3); // priority 3
            expect(listeners[2].fn).toBe(listener1); // priority 1
        });
        
        test('should throw error for non-function listener', () => {
            expect(() => {
                emitter.on('test', 'not a function');
            }).toThrow('Listener must be a function');
        });
        
        test('should warn when max listeners exceeded', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // Add more than max listeners
            for (let i = 0; i <= emitter.maxListeners; i++) {
                emitter.on('test', jest.fn());
            }
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Max listeners (10) exceeded for event: test')
            );
            
            consoleSpy.mockRestore();
        });
        
        test('should return emitter instance for chaining', () => {
            const result = emitter.on('test', jest.fn());
            expect(result).toBe(emitter);
        });
    });
    
    describe('once method', () => {
        test('should add one-time listener', () => {
            const listener = jest.fn();
            
            emitter.once('test', listener);
            
            const listeners = emitter.events.get('test');
            expect(listeners[0].once).toBe(true);
        });
        
        test('should remove listener after first emission', () => {
            const listener = jest.fn();
            
            emitter.once('test', listener);
            emitter.emit('test');
            emitter.emit('test');
            
            expect(listener).toHaveBeenCalledTimes(1);
            expect(emitter.events.has('test')).toBe(false);
        });
    });
    
    describe('off method', () => {
        test('should remove specific listener', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            
            emitter.on('test', listener1);
            emitter.on('test', listener2);
            
            emitter.off('test', listener1);
            
            const listeners = emitter.events.get('test');
            expect(listeners).toHaveLength(1);
            expect(listeners[0].fn).toBe(listener2);
        });
        
        test('should clean up empty event arrays', () => {
            const listener = jest.fn();
            
            emitter.on('test', listener);
            emitter.off('test', listener);
            
            expect(emitter.events.has('test')).toBe(false);
        });
        
        test('should handle removing non-existent listener', () => {
            const listener = jest.fn();
            
            expect(() => {
                emitter.off('test', listener);
            }).not.toThrow();
        });
        
        test('should return emitter instance for chaining', () => {
            const result = emitter.off('test', jest.fn());
            expect(result).toBe(emitter);
        });
    });
    
    describe('removeAllListeners method', () => {
        test('should remove all listeners for specific event', () => {
            emitter.on('test1', jest.fn());
            emitter.on('test1', jest.fn());
            emitter.on('test2', jest.fn());
            
            emitter.removeAllListeners('test1');
            
            expect(emitter.events.has('test1')).toBe(false);
            expect(emitter.events.has('test2')).toBe(true);
        });
        
        test('should remove all listeners for all events', () => {
            emitter.on('test1', jest.fn());
            emitter.on('test2', jest.fn());
            
            emitter.removeAllListeners();
            
            expect(emitter.events.size).toBe(0);
        });
    });
    
    describe('emit method', () => {
        test('should call all listeners for event', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            
            emitter.on('test', listener1);
            emitter.on('test', listener2);
            
            emitter.emit('test', 'arg1', 'arg2');
            
            expect(listener1).toHaveBeenCalledWith('arg1', 'arg2');
            expect(listener2).toHaveBeenCalledWith('arg1', 'arg2');
        });
        
        test('should return true if event has listeners', () => {
            emitter.on('test', jest.fn());
            
            const result = emitter.emit('test');
            expect(result).toBe(true);
        });
        
        test('should return false if event has no listeners', () => {
            const result = emitter.emit('nonexistent');
            expect(result).toBe(false);
        });
        
        test('should handle listener errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const goodListener = jest.fn();
            const badListener = jest.fn(() => {
                throw new Error('Listener error');
            });
            
            emitter.on('test', badListener);
            emitter.on('test', goodListener);
            
            emitter.emit('test');
            
            expect(goodListener).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error in event listener for test:'),
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });
        
        test('should call listeners in priority order', () => {
            const callOrder = [];
            const listener1 = jest.fn(() => callOrder.push(1));
            const listener2 = jest.fn(() => callOrder.push(2));
            const listener3 = jest.fn(() => callOrder.push(3));
            
            emitter.on('test', listener1, { priority: 1 });
            emitter.on('test', listener2, { priority: 5 });
            emitter.on('test', listener3, { priority: 3 });
            
            emitter.emit('test');
            
            expect(callOrder).toEqual([2, 3, 1]); // priority order: 5, 3, 1
        });
    });
    
    describe('utility methods', () => {
        test('should return correct listener count', () => {
            emitter.on('test', jest.fn());
            emitter.on('test', jest.fn());
            
            expect(emitter.listenerCount('test')).toBe(2);
            expect(emitter.listenerCount('nonexistent')).toBe(0);
        });
        
        test('should return all event names', () => {
            emitter.on('event1', jest.fn());
            emitter.on('event2', jest.fn());
            
            const eventNames = emitter.eventNames();
            expect(eventNames).toContain('event1');
            expect(eventNames).toContain('event2');
            expect(eventNames).toHaveLength(2);
        });
        
        test('should set max listeners', () => {
            emitter.setMaxListeners(20);
            expect(emitter.maxListeners).toBe(20);
            
            const result = emitter.setMaxListeners(15);
            expect(result).toBe(emitter);
        });
    });
});