function deepGet(obj, path) {
  if (obj == null) return undefined;
  if (!path) return obj;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
    if (current === undefined) return undefined;
  }
  return current;
}
module.exports = { deepGet };
