function memoize(fn) {
  if (typeof fn !== "function") return function() {};
  const cache = new Map();
  return function(arg) {
    if (cache.has(arg)) return cache.get(arg);
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}
module.exports = { memoize };
