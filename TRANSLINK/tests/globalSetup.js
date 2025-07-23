/**
 * TRANSLINK - Global Test Setup
 * Setup that runs once before all tests
 */

export default async function globalSetup() {
  // Set up global test environment
  process.env.NODE_ENV = 'test';
  
  // Mock browser APIs that might not be available in test environment
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  // Mock WebGL context
  global.WebGLRenderingContext = class WebGLRenderingContext {};
  global.WebGL2RenderingContext = class WebGL2RenderingContext {};
  
  // Mock AudioContext
  global.AudioContext = class AudioContext {
    constructor() {
      this.state = 'running';
    }
    resume() {
      return Promise.resolve();
    }
    suspend() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  };
  
  // Mock MediaDevices
  global.navigator.mediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue({})
  };
  
  console.log('Global test setup completed');
}