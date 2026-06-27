function anagramGroups(strs) {
  if (!Array.isArray(strs)) return [];
  const map = {};
  for (const s of strs) {
    const key = s.split("").sort().join("");
    if (!map[key]) map[key] = [];
    map[key].push(s);
  }
  return Object.values(map);
}
module.exports = { anagramGroups };
