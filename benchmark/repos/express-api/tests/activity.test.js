const request = require("supertest");
const app = require("../src/index");

describe("Activity Tracking", () => {
  it("POST /api/users/1/activity returns 201 with activity object", async () => {
    const res = await request(app)
      .post("/api/users/1/activity")
      .set("Authorization", "Bearer test")
      .send({ action: "login" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.action).toBe("login");
  });

  it("POST /api/users/1/activity rejects empty action with 400", async () => {
    const res = await request(app)
      .post("/api/users/1/activity")
      .set("Authorization", "Bearer test")
      .send({ action: "" });
    expect(res.status).toBe(400);
  });

  it("POST /api/users/999/activity returns 404 for unknown user", async () => {
    const res = await request(app)
      .post("/api/users/999/activity")
      .set("Authorization", "Bearer test")
      .send({ action: "login" });
    expect(res.status).toBe(404);
  });

  it("Existing endpoints still work after adding activity", async () => {
    const res = await request(app).get("/api/users").set("Authorization", "Bearer test");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});
