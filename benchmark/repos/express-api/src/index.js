const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./routes/users");
const authMiddleware = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Public routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Protected routes
app.use("/api/users", authMiddleware, userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
