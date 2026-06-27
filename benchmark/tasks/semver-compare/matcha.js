const semverCompare = (a, b) => {
  const [ma, mi, p] = a.split(".").map(Number);
  const [mb, mi2, p2] = b.split(".").map(Number);
  return ma !== mb ? Math.sign(ma - mb) : mi !== mi2 ? Math.sign(mi - mi2) : Math.sign(p - p2);
};
module.exports = { semverCompare };
