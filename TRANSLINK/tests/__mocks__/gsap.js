/**
 * TRANSLINK - GSAP Mock
 * Mock implementation of GSAP for testing
 */

const mockTween = {
  play: jest.fn().mockReturnThis(),
  pause: jest.fn().mockReturnThis(),
  restart: jest.fn().mockReturnThis(),
  reverse: jest.fn().mockReturnThis(),
  kill: jest.fn().mockReturnThis(),
  progress: jest.fn().mockReturnThis(),
  duration: jest.fn().mockReturnThis(),
  delay: jest.fn().mockReturnThis(),
  then: jest.fn().mockReturnThis(),
  eventCallback: jest.fn().mockReturnThis(),
  timeScale: jest.fn().mockReturnThis()
};

const mockTimeline = {
  ...mockTween,
  add: jest.fn().mockReturnThis(),
  to: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  fromTo: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  call: jest.fn().mockReturnThis(),
  addLabel: jest.fn().mockReturnThis(),
  removeLabel: jest.fn().mockReturnThis()
};

const gsap = {
  // Core methods
  to: jest.fn(() => mockTween),
  from: jest.fn(() => mockTween),
  fromTo: jest.fn(() => mockTween),
  set: jest.fn(() => mockTween),
  
  // Timeline
  timeline: jest.fn(() => mockTimeline),
  
  // Utilities
  utils: {
    toArray: jest.fn((selector) => {
      if (typeof selector === 'string') {
        return [];
      }
      return Array.isArray(selector) ? selector : [selector];
    }),
    selector: jest.fn(),
    checkPrefix: jest.fn(),
    clamp: jest.fn((min, max, value) => Math.max(min, Math.min(max, value)))
  },
  
  // Configuration
  config: jest.fn(),
  defaults: jest.fn(),
  
  // Registration
  registerPlugin: jest.fn(),
  registerEffect: jest.fn(),
  
  // Ticker
  ticker: {
    add: jest.fn(),
    remove: jest.fn(),
    fps: jest.fn(() => 60),
    deltaRatio: jest.fn(() => 1)
  },
  
  // Quick methods
  quickTo: jest.fn(() => jest.fn()),
  quickSetter: jest.fn(() => jest.fn()),
  
  // Getters
  getProperty: jest.fn(),
  getTweensOf: jest.fn(() => []),
  
  // Control
  killTweensOf: jest.fn(),
  delayedCall: jest.fn(() => mockTween),
  
  // Export for ES modules
  default: undefined
};

// Set default export
gsap.default = gsap;

// Plugins
export const ScrollTrigger = {
  create: jest.fn(() => ({
    kill: jest.fn(),
    refresh: jest.fn(),
    update: jest.fn()
  })),
  refresh: jest.fn(),
  update: jest.fn(),
  getAll: jest.fn(() => []),
  killAll: jest.fn(),
  batch: jest.fn(),
  saveStyles: jest.fn(),
  revert: jest.fn()
};

export const SplitText = jest.fn(() => ({
  chars: [],
  words: [],
  lines: [],
  revert: jest.fn()
}));

export const Flip = {
  getState: jest.fn(() => ({})),
  from: jest.fn(() => mockTween),
  to: jest.fn(() => mockTween),
  fit: jest.fn(() => mockTween)
};

export const CustomEase = {
  create: jest.fn(() => 'power2.out')
};

export const DrawSVGPlugin = {};
export const MorphSVGPlugin = {};
export const TextPlugin = {};

// Easing functions
export const easePrimary = 'power2.out';
export const easeMenu = 'power2.inOut';
export const easeDirectional = 'power1.out';
export const easeBlur = 'power2.out';
export const easeGentleIn = 'power1.in';
export const easeQuickSnap = 'back.out(1.7)';
export const easeInstant = 'none';
export const easeText = 'power2.out';

// Reduced motion
export const reduced = false;

// Defaults
export const defaults = {
  ease: 'power2.out',
  duration: 1.2
};

export default gsap;