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

describe("register (real database)", () => {
  it("only allows one winner when two registrations race for the same email", async () => {
    const [resA, resB] = await Promise.all([
      request(app).post("/register").send(credentials),
      request(app).post("/register").send(credentials),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);
  });
});
