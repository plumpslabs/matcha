const request = require("supertest");
const app = require("../src/index");

describe("Server", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/users requires auth", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("GET /api/users with auth works", async () => {
    const res = await request(app).get("/api/users").set("Authorization", "Bearer test");
    expect(res.status).toBe(200);
  });
});
