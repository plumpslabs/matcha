const throttle = (fn, ms) => {
  if (typeof fn !== "function") return () => {};
  let last = 0, timer, lastArgs;
  return (...a) => {
    const now = Date.now(), rem = ms - (now - last);
    if (rem <= 0) { clearTimeout(timer); timer = null; last = now; fn(...a); }
    else { lastArgs = a; if (!timer) timer = setTimeout(() => { timer = null; last = Date.now(); lastArgs && (fn(...lastArgs), lastArgs = null); }, rem); }
  };
};
module.exports = { throttle };
