const express = require("express");
const usersRouter = require("./routes/users");
const authMiddleware = require("./middleware/auth");

const app = express();
app.use(express.json());
app.use(authMiddleware);

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/users", usersRouter);

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}