function isPalindrome(str) {
  if (typeof str !== "string") return false;
  // Clean the string: lowercase + remove non-alphanumeric
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Compare with reversed
  return clean === clean.split("").reverse().join("");
}
module.exports = { isPalindrome };
