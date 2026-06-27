const chunk = (a, s) =>
  !Array.isArray(a) || s < 1 ? [] : Array.from(
    { length: Math.ceil(a.length / s) },
    (_, i) => a.slice(i * s, i * s + s)
  );
module.exports = { chunk };
