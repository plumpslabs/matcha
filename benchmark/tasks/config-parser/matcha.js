const parseConfig = (s) =>
  typeof s !== "string" ? {} : Object.fromEntries(
    s.split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("#") && !l.startsWith(";"))
      .map(l => l.split("=").map(p => p.trim()))
      .filter(([k]) => k)
  );
module.exports = { parseConfig };
