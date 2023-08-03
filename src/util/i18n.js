export function i(ctx, key, params = {}, defaultValue = '') {
  if (!ctx || !key) return defaultValue

  const template = ctx[key].replace(/\{(\w+)\}/gim, (match, p1) => params[p1] || p1)

  return template || defaultValue
}