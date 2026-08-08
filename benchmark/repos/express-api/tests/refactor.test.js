const request = require("supertest");
const app = require("../src/index");

describe("Refactor: service layer", () => {
  test("service module exists and exposes the API", () => {
    // Baseline: this file does not exist → require throws → suite FAILS.
    const service = require("../src/services/userService");
    expect(typeof service.listUsers).toBe("function");
    expect(typeof service.getUserById).toBe("function");
  });

  test("GET /api/users still returns all users", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  test("GET /api/users/:id still returns the user", async () => {
    const res = await request(app).get("/api/users/1");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Alice");
  });

  test("route delegates to the service (no duplicated inline store)", () => {
    const usersRoute = require("fs").readFileSync(
      require("path").join(__dirname, "../src/routes/users.js"),
      "utf-8",
    );
    const serviceRoute = require("fs").readFileSync(
      require("path").join(__dirname, "../src/services/userService.js"),
      "utf-8",
    );
    // Seed data must be reachable from the service layer (unique emails are the
    // reliable markers — names like "Alice" are too generic for absence checks).
    expect(serviceRoute).toMatch(/alice@example\.com/);
    expect(serviceRoute).toMatch(/bob@example\.com/);
    // The route must require the service and NOT redeclare the seed emails.
    expect(usersRoute).toMatch(/userService/);
    expect(usersRoute).not.toMatch(/alice@example\.com/);
  });
});
