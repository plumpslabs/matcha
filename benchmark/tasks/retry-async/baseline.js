function retry(fn, retries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    if (typeof fn !== "function") {
      return reject(new Error("fn must be a function"));
    }
    const attempt = (n) => {
      fn().then(resolve).catch((err) => {
        if (n <= 1) return reject(err);
        setTimeout(() => attempt(n - 1), delay);
      });
    };
    attempt(retries);
  });
}
module.exports = { retry };
