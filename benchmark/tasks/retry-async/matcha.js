const retry = (fn, n = 3, ms = 1000) =>
  typeof fn !== "function"
    ? Promise.reject(new Error("fn must be a function"))
    : fn().catch((e) => (n <= 1 ? Promise.reject(e) : new Promise((r) => setTimeout(r, ms)).then(() => retry(fn, n - 1, ms))));
module.exports = { retry };
