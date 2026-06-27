function pipe(...fns) {
  for (const fn of fns) {
    if (typeof fn !== "function") {
      throw new Error("All arguments must be functions");
    }
  }
  return function(initial) {
    return fns.reduce((acc, fn) => fn(acc), initial);
  };
}
module.exports = { pipe };
