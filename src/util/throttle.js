/**
 * Limita a execução de uma função a uma vez a cada intervalo de tempo
 * @param {Function} func Função a ser executada
 * @param {Number} limit Limite de tempo em ms
 * @returns {Function} Função com throttle aplicado
 */
/**
 * Versão otimizada da função throttle que prioriza performance em situações de alta carga
 *
 * @param {Function} func Função a ser executada
 * @param {Number} limit Limite de tempo em ms
 * @param {Object} options Opções adicionais
 * @param {Boolean} options.leading Executar na primeira chamada (padrão: true)
 * @param {Boolean} options.trailing Executar na última chamada após o limite (padrão: true)
 * @returns {Function} Função com throttle aplicado
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
