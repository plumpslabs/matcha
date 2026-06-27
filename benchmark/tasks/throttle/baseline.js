function throttle(fn, wait) {
  if (typeof fn !== "function") return function() {};
  let lastCall = 0;
  let timer = null;
  let lastArgs = null;

  return function(...args) {
    const now = Date.now();
    const remaining = wait - (now - lastCall);

    if (remaining <= 0) {
      // Cooldown expired — fire immediately
      if (timer) { clearTimeout(timer); timer = null; }
      lastCall = now;
      fn(...args);
    } else {
      // In cooldown — queue the last call
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          lastCall = Date.now();
          if (lastArgs) { fn(...lastArgs); lastArgs = null; }
        }, remaining);
      }
    }
  };
}
module.exports = { throttle };
