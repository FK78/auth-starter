import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../app.ts";
import { checkDatabaseHealth } from "../services/health.service.ts";
import { AppError } from "../errors/AppError.ts";

vi.mock("../services/health.service.ts");

describe("GET /health", () => {
  it("returns 200 when the DB check succeeds", async () => {
    vi.mocked(checkDatabaseHealth).mockResolvedValue(undefined);

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns 503 when the DB check fails", async () => {
    vi.mocked(checkDatabaseHealth).mockRejectedValue(
      new AppError("Service unavailable", 503),
    );

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: "Service unavailable" });
  });
});
