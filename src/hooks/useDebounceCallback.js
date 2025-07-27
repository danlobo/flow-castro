import { useCallback, useRef, useEffect } from "react";

/**
 * Hook that creates a debounced version of a callback function.
 * Useful for limiting the frequency of function execution in events like scroll, resize, input, etc.
 *
 * @param {Function} fn - The function to be executed after the debounce
 * @param {number} wait - The waiting time in milliseconds
 * @returns {Function} A debounced function that delays the execution of the original function
 */
export function useDebounceCallback(fn, wait = 200) {
  const timeoutRef = useRef(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cancel;
  }, [fn, wait, cancel]);

  const debouncedFn = useCallback(
    (...args) => {
      cancel();

      timeoutRef.current = setTimeout(() => {
        fn(...args);
        timeoutRef.current = null;
      }, wait);
    },
    [fn, wait, cancel]
  );

  debouncedFn.cancel = cancel;

  return debouncedFn;
}

export default useDebounceCallback;
