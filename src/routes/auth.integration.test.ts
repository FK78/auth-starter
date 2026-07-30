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

  it("detects reuse within a single token family and revokes the whole lineage", async () => {
    const registerRes = await request(app).post("/register").send(credentials);
    const originalToken = registerRes.body.refreshToken as string;

    const rotateRes = await request(app)
      .post("/refresh")
      .send({ refreshToken: originalToken });
    expect(rotateRes.status).toBe(200);
    const rotatedToken = rotateRes.body.refreshToken as string;
    expect(rotatedToken).not.toBe(originalToken);

    const reuseRes = await request(app)
      .post("/refresh")
      .send({ refreshToken: originalToken });
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error).toBe("Refresh token reuse detected");

    const rotatedTokenNowRevokedRes = await request(app)
      .post("/refresh")
      .send({ refreshToken: rotatedToken });
    expect(rotatedTokenNowRevokedRes.status).toBe(401);
  });

  it("only allows one winner when the same refresh token is used concurrently", async () => {
    const registerRes = await request(app).post("/register").send(credentials);
    const refreshToken = registerRes.body.refreshToken as string;

    const [resA, resB] = await Promise.all([
      request(app).post("/refresh").send({ refreshToken }),
      request(app).post("/refresh").send({ refreshToken }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 401]);

    const loser = resA.status === 401 ? resA : resB;
    expect(loser.body.error).toBe("Refresh token reuse detected");
  });

  it("rejects an unknown refresh token", async () => {
    const res = await request(app)
      .post("/refresh")
      .send({ refreshToken: "not-a-real-token" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid refresh token");
  });
});
