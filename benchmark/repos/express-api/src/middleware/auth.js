module.exports = function authMiddleware(req, res, next) {
  if (req.path === "/health") return next();
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  next();
};
