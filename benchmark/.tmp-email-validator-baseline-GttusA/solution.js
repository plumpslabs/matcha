const EMAIL_RE = /^[\w.%+-]+@[\w.-]+\.[a-z]{2,}$/i;
function isValidEmail(email) {
  if (typeof email !== "string") return false;
  return EMAIL_RE.test(email);
}
module.exports = { isValidEmail };