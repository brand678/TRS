/**
 * TRANSLINK - Lenis Mock
 * Mock implementation of Lenis smooth scroll for testing
 */

export default class Lenis {
  constructor(options = {}) {
    this.options = options;
    this.isScrolling = false;
    this.animatedScroll = 0;
    this.targetScroll = 0;
    this.velocity = 0;
    this.direction = 0;
    this.progress = 0;
    this.limit = 1000;
    this.callbacks = [];
  }

  on(event, callback) {
    this.callbacks.push({ event, callback });
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb.callback !== callback);
    };
  }

  off(event, callback) {
    this.callbacks = this.callbacks.filter(cb => 
      cb.event !== event || cb.callback !== callback
    );
  }

  emit(event, data) {
    this.callbacks
      .filter(cb => cb.event === event)
      .forEach(cb => cb.callback(data));
  }

  raf(time) {
    // Mock RAF implementation
    this.emit('scroll', {
      scroll: this.animatedScroll,
      limit: this.limit,
      velocity: this.velocity,
      progress: this.progress
    });
  }

  scrollTo(target, options = {}) {
    const targetValue = typeof target === 'number' ? target : 0;
    
    if (options.immediate) {
      this.animatedScroll = targetValue;
      this.targetScroll = targetValue;
      this.progress = targetValue / this.limit;
    } else {
      this.targetScroll = targetValue;
      // Simulate smooth scroll
      setTimeout(() => {
        this.animatedScroll = targetValue;
        this.progress = targetValue / this.limit;
        this.emit('scroll', {
          scroll: this.animatedScroll,
          limit: this.limit,
          velocity: 0,
          progress: this.progress
        });
      }, 100);
    }
  }

  start() {
    this.isScrolling = true;
  }

  stop() {
    this.isScrolling = false;
  }

  resize() {
    // Mock resize handling
  }

  destroy() {
    this.callbacks = [];
  }

  // Getters
  get scroll() {
    return this.animatedScroll;
  }

  get y() {
    return this.animatedScroll;
  }

  get max() {
    return this.limit;
  }

  get speed() {
    return this.velocity;
  }

  get percent() {
    return this.progress;
  }
}