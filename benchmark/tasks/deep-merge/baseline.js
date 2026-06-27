function deepMerge(target, source) {
  const result = {};
  const t = target && typeof target === "object" ? target : {};
  const s = source && typeof source === "object" ? source : {};

  for (const key of new Set([...Object.keys(t), ...Object.keys(s)])) {
    const tv = t[key];
    const sv = s[key];

    if (Array.isArray(tv) && Array.isArray(sv)) {
      result[key] = [...tv, ...sv];
    } else if (tv && typeof tv === "object" && sv && typeof sv === "object" && !Array.isArray(tv) && !Array.isArray(sv)) {
      result[key] = deepMerge(tv, sv);
    } else if (sv !== undefined) {
      result[key] = sv;
    } else {
      result[key] = tv;
    }
  }

  return result;
}
module.exports = { deepMerge };
