import { describe, it, expect, afterEach, vi } from "vitest";
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

describe("CORS", () => {
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

  afterEach(() => {
    process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
  });

  const loadAppWithOrigins = async (origins: string) => {
    process.env.ALLOWED_ORIGINS = origins;
    vi.resetModules();
    return (await import("./app.ts")).app;
  };

  it("omits Access-Control-Allow-Origin when ALLOWED_ORIGINS is unset", async () => {
    const res = await request(app)
      .get("/no-such-route")
      .set("Origin", "http://evil.example.com");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("reflects an origin that is on the allow-list", async () => {
    const scopedApp = await loadAppWithOrigins("http://good.example.com");

    const res = await request(scopedApp)
      .get("/no-such-route")
      .set("Origin", "http://good.example.com");

    expect(res.headers["access-control-allow-origin"]).toBe("http://good.example.com");
  });

  it("omits the header for an origin that is not on the allow-list", async () => {
    const scopedApp = await loadAppWithOrigins("http://good.example.com");

    const res = await request(scopedApp)
      .get("/no-such-route")
      .set("Origin", "http://evil.example.com");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("health check without a reachable database", () => {
  const originalPort = process.env.POSTGRES_PORT;

  afterEach(() => {
    process.env.POSTGRES_PORT = originalPort;
  });

  it("returns 503 when the database can't be reached at all", async () => {
    process.env.POSTGRES_PORT = "1"; // reserved port, nothing listens here
    vi.resetModules();
    const { app: scopedApp } = await import("./app.ts");

    const res = await request(scopedApp).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.error).toBeTypeOf("string");
  });
});
