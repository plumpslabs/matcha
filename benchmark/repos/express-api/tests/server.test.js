const request = require("supertest");
const app = require("../src/index");

describe("Server", () => {
  describe("GET /health", () => {
    it("should return ok status", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(typeof res.body.uptime).toBe("number");
    });
  });

  describe("404 handler", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await request(app).get("/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Not found");
    });
  });
});
