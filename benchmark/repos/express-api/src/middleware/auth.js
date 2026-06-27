// Simple API key auth middleware (fixture — not production-grade)
const API_KEY = process.env.API_KEY || "dev-key-123";

function authMiddleware(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: invalid or missing API key" });
  }

  next();
}

module.exports = authMiddleware;
