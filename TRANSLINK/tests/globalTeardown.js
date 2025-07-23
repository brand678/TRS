/**
 * TRANSLINK - Global Test Teardown
 * Cleanup that runs once after all tests
 */

export default async function globalTeardown() {
  // Clean up any global resources
  
  // Clear any timers that might be running
  jest.clearAllTimers();
  
  // Reset global mocks
  if (global.ResizeObserver) {
    delete global.ResizeObserver;
  }
  
  if (global.IntersectionObserver) {
    delete global.IntersectionObserver;
  }
  
  if (global.WebGLRenderingContext) {
    delete global.WebGLRenderingContext;
  }
  
  if (global.WebGL2RenderingContext) {
    delete global.WebGL2RenderingContext;
  }
  
  if (global.AudioContext) {
    delete global.AudioContext;
  }
  
  console.log('Global test teardown completed');
}