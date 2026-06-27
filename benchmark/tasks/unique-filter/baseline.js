function unique(arr, key) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const result = [];
  for (const item of arr) {
    const k = key ? key(item) : item;
    if (!seen.has(k)) {
      seen.add(k);
      result.push(item);
    }
  }
  return result;
}
module.exports = { unique };
