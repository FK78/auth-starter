import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./app.ts";

describe("malformed request bodies", () => {
  it("responds 400 to unparsable JSON, not a generic 500", async () => {
    const res = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send("{ this is not valid json");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTypeOf("string");
  });
});
