const request = require("supertest");
const app = require("../src/index");

describe("Rate Limiting", () => {
  const BURST_COUNT = 101;

  it("blocks requests beyond the limit with 429", async () => {
    let res;
    for (let i = 0; i < BURST_COUNT; i++) {
      res = await request(app)
        .get("/api/users")
        .set("Authorization", "Bearer test");
    }
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("retryAfter");
  });

  it("/health bypasses rate limiting", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
    }
  });
});
