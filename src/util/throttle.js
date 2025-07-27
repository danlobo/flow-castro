/**
 * Limits the execution of a function to once per time interval
 * @param {Function} func Function to be executed
 * @param {Number} limit Time limit in ms
 * @returns {Function} Function with throttle applied
 */
/**
 * Optimized version of the throttle function that prioritizes performance in high-load situations
 *
 * @param {Function} func Function to be executed
 * @param {Number} limit Time limit in ms
 * @param {Object} options Additional options
 * @param {Boolean} options.leading Execute on the first call (default: true)
 * @param {Boolean} options.trailing Execute on the last call after the limit (default: true)
 * @returns {Function} Function with throttle applied
 */
export function throttle(func, limit = 16, options = {}) {
  const { leading = true, trailing = true } = options;

  let lastCall = 0;
  let lastArgs = null;
  let lastThis = null;
  let timeoutId = null;
  let lastResult;

  const cancelScheduled = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  function throttled(...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    lastArgs = args;
    lastThis = this;

    if ((leading && lastCall === 0) || remaining <= 0) {
      cancelScheduled();
      lastCall = now;
      lastResult = func.apply(lastThis, lastArgs);

      if (!trailing) {
        lastArgs = lastThis = null;
      }
      return lastResult;
    }

    if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        lastCall = leading ? Date.now() : 0;
        timeoutId = null;
        lastResult = func.apply(lastThis, lastArgs);

        if (!timeoutId) lastArgs = lastThis = null;
      }, remaining);
    }

    return lastResult;
  }

  throttled.cancel = cancelScheduled;

  return throttled;
}
