const deepGet = (o, p) =>
  !p ? o : p.split(".").reduce((c, k) => (c ?? {})[k], o);
module.exports = { deepGet };
