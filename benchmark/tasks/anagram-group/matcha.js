const anagramGroups = (strs) =>
  !Array.isArray(strs) ? [] : Object.values(
    strs.reduce((m, s) => {
      (m[[...s].sort().join("")] ??= []).push(s);
      return m;
    }, {})
  );
module.exports = { anagramGroups };
