const request = require("supertest");
const app = require("../src/index");

const API_KEY = "dev-key-123";

describe("Users API", () => {
  describe("GET /api/users", () => {
    it("should return all users", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("x-api-key", API_KEY);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
    });

    it("should filter users by role", async () => {
      const res = await request(app)
        .get("/api/users?role=admin")
        .set("x-api-key", API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("Alice");
    });

    it("should search users by name", async () => {
      const res = await request(app)
        .get("/api/users?search=bob")
        .set("x-api-key", API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("Bob");
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return user by id", async () => {
      const res = await request(app)
        .get("/api/users/1")
        .set("x-api-key", API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Alice");
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .get("/api/users/999")
        .set("x-api-key", API_KEY);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/users", () => {
    it("should create a new user", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("x-api-key", API_KEY)
        .send({ name: "Dave", email: "dave@example.com" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Dave");
      expect(res.body.id).toBeDefined();
    });

    it("should require name and email", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("x-api-key", API_KEY)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update user name", async () => {
      const res = await request(app)
        .put("/api/users/1")
        .set("x-api-key", API_KEY)
        .send({ name: "Alice Updated" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Alice Updated");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete user", async () => {
      const res = await request(app)
        .delete("/api/users/1")
        .set("x-api-key", API_KEY);

      expect(res.status).toBe(204);
    });
  });

  describe("Authentication", () => {
    it("should reject requests without API key", async () => {
      const res = await request(app).get("/api/users");

      expect(res.status).toBe(401);
    });

    it("should reject requests with wrong API key", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("x-api-key", "wrong-key");

      expect(res.status).toBe(401);
    });
  });
});
