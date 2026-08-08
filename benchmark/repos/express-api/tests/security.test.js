const request = require("supertest");
const app = require("../src/index");

describe("Security: auth bypass + input validation", () => {
  test("no token → 401", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  test("authorization literal 'null' → 401 (bypass bug)", async () => {
    const res = await request(app).get("/api/users").set("authorization", "null");
    expect(res.status).toBe(401);
  });

  test("authorization literal 'undefined' → 401 (bypass bug)", async () => {
    const res = await request(app).get("/api/users").set("authorization", "undefined");
    expect(res.status).toBe(401);
  });

  test("valid Bearer token → 200", async () => {
    const res = await request(app).get("/api/users").set("authorization", "Bearer secret-token");
    expect(res.status).toBe(200);
  });

  test("/health stays public", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  test("non-numeric id → 400 (invalid input), not 404", async () => {
    const res = await request(app).get("/api/users/abc").set("authorization", "Bearer secret-token");
    expect(res.status).toBe(400);
  });
});
