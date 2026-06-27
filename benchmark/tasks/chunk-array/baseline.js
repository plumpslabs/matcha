function chunk(arr, size) {
  if (!Array.isArray(arr)) return [];
  if (typeof size !== "number" || size < 1) return [];
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
module.exports = { chunk };
