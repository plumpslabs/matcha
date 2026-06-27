function parseConfig(str) {
  if (typeof str !== "string") return {};
  const result = {};
  for (const line of str.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}
module.exports = { parseConfig };
