import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.ts";
import { pool } from "../db/db.ts";
import { resetTestDb } from "../db/testDb.ts";

const credentials = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse-battery",
};

beforeEach(async () => {
  await resetTestDb();
});

afterAll(async () => {
  await pool.end();
});

describe("auth flow (real database)", () => {
  it("registers, logs in, and rejects a duplicate email", async () => {
    const registerRes = await request(app).post("/register").send(credentials);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.accessToken).toBeTypeOf("string");
    expect(registerRes.body.refreshToken).toBeTypeOf("string");

    const duplicateRes = await request(app).post("/register").send(credentials);
    expect(duplicateRes.status).toBe(409);

    const loginRes = await request(app)
      .post("/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeTypeOf("string");

    const wrongPasswordRes = await request(app)
      .post("/login")
      .send({ email: credentials.email, password: "wrong-password" });
    expect(wrongPasswordRes.status).toBe(401);
  });

  it("rotates the refresh token and detects reuse of a spent one", async () => {
    const registerRes = await request(app).post("/register").send(credentials);
    const firstRefreshToken = registerRes.body.refreshToken as string;

    const rotateRes = await request(app)
      .post("/refresh")
      .send({ refreshToken: firstRefreshToken });
    expect(rotateRes.status).toBe(200);
    const secondRefreshToken = rotateRes.body.refreshToken as string;
    expect(secondRefreshToken).not.toBe(firstRefreshToken);

    // Reusing the already-rotated-away token should be rejected...
    const reuseRes = await request(app)
      .post("/refresh")
      .send({ refreshToken: firstRefreshToken });
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error).toBe("Refresh token reuse detected");

    // ...and should have revoked the WHOLE family, including the token that
    // was legitimately issued by the rotation above.
    const secondTokenNowRevokedRes = await request(app)
      .post("/refresh")
      .send({ refreshToken: secondRefreshToken });
    expect(secondTokenNowRevokedRes.status).toBe(401);
  });

  it("rejects an unknown refresh token", async () => {
    const res = await request(app)
      .post("/refresh")
      .send({ refreshToken: "not-a-real-token" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid refresh token");
  });
});
