const ALNUM = /[^a-z0-9]/g;
const isPalindrome = (s) =>
  typeof s === "string" &&
  (s = s.toLowerCase().replace(ALNUM, "")) &&
  s === [...s].reverse().join("");
module.exports = { isPalindrome };
