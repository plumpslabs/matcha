const memoize = (fn) => {
  if (typeof fn !== "function") return () => {};
  const c = new Map();
  return (a) => c.has(a) ? c.get(a) : (c.set(a, fn(a)), c.get(a));
};
module.exports = { memoize };
