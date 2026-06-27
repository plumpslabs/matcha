const express = require("express");
const router = express.Router();

// In-memory user store (fixture — simple, no DB)
let users = [
  { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
  { id: 2, name: "Bob", email: "bob@example.com", role: "user" },
  { id: 3, name: "Charlie", email: "charlie@example.com", role: "user" },
];
let nextId = 4;

// GET /api/users — list all users
router.get("/", (req, res) => {
  const { role, search } = req.query;

  let result = users;

  // Filter by role
  if (role) {
    result = result.filter((u) => u.role === role);
  }

  // Search by name (case-insensitive)
  if (search) {
    const q = search.toLowerCase();
    result = result.filter((u) => u.name.toLowerCase().includes(q));
  }

  res.json(result);
});

// GET /api/users/:id — get single user
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

// POST /api/users — create user
router.post("/", (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const newUser = { id: nextId++, name, email, role: role || "user" };
  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT /api/users/:id — update user
router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = users.findIndex((u) => u.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const { name, email, role } = req.body;
  if (name) users[idx].name = name;
  if (email) users[idx].email = email;
  if (role) users[idx].role = role;

  res.json(users[idx]);
});

// DELETE /api/users/:id — delete user
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = users.findIndex((u) => u.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  users.splice(idx, 1);
  res.status(204).send();
});

module.exports = router;
