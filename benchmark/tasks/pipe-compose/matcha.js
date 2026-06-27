const pipe = (...fns) => {
  fns.forEach((f) => { if (typeof f !== "function") throw new Error("All arguments must be functions"); });
  return (v) => fns.reduce((a, f) => f(a), v);
};
module.exports = { pipe };
