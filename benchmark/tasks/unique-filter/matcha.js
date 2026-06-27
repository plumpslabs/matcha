const unique = (a, k) =>
  !Array.isArray(a) ? [] : a.filter(
    ((s) => (v) => { const key = k ? k(v) : v; return s.has(key) ? false : (s.add(key), true); })(new Set())
  );
module.exports = { unique };
