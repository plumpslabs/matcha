const deepClone = (v) =>
  v instanceof Date ? new Date(v)
  : Array.isArray(v) ? v.map(deepClone)
  : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).map(([k, v]) => [k, deepClone(v)]))
  : v;
module.exports = { deepClone };
