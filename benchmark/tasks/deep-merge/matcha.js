const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const deepMerge = (t, s) => {
  const keys = new Set([...(t && isObj(t) ? Object.keys(t) : []), ...(s && isObj(s) ? Object.keys(s) : [])]);
  return [...keys].reduce((r, k) => {
    const tv = t?.[k], sv = s?.[k];
    r[k] = Array.isArray(tv) && Array.isArray(sv) ? [...tv, ...sv]
      : isObj(tv) && isObj(sv) ? deepMerge(tv, sv)
      : sv !== undefined ? sv : tv;
    return r;
  }, {});
};
module.exports = { deepMerge };
