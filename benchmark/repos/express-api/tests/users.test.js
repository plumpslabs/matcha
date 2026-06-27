const request = require("supertest");
const app = require("../src/index");

describe("Users API", () => {
  it("GET /api/users returns users", async () => {
    const res = await request(app).get("/api/users").set("Authorization", "Bearer test");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("GET /api/users/1 returns single user", async () => {
    const res = await request(app).get("/api/users/1").set("Authorization", "Bearer test");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Alice");
  });

  it("GET /api/users/999 returns 404", async () => {
    const res = await request(app).get("/api/users/999").set("Authorization", "Bearer test");
    expect(res.status).toBe(404);
  });

  it("GET /api/users?page=1&limit=1 handles pagination", async () => {
    const res = await request(app).get("/api/users?page=1&limit=1").set("Authorization", "Bearer test");
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(1);
  });
});
