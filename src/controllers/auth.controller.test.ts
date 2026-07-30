import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../app.ts";
import { registerUser, loginUser, refreshTokens } from "../services/auth.service.ts";
import { AppError } from "../errors/AppError.ts";

vi.mock("../services/auth.service.ts");

const fakeTokens = { accessToken: "access-token", refreshToken: "refresh-token" };

describe("POST /register", () => {
  it("returns 201 with a token pair for a valid payload", async () => {
    vi.mocked(registerUser).mockResolvedValue(fakeTokens);

    const res = await request(app).post("/register").send({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse-battery",
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(fakeTokens);
  });

  it("returns 400 for an invalid payload without calling the service", async () => {
    const res = await request(app).post("/register").send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(registerUser).not.toHaveBeenCalled();
  });
});

describe("POST /login", () => {
  it("returns 200 with a token pair for valid credentials", async () => {
    vi.mocked(loginUser).mockResolvedValue(fakeTokens);

    const res = await request(app)
      .post("/login")
      .send({ email: "ada@example.com", password: "correct-horse-battery" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeTokens);
  });

  it("returns 400 for an invalid payload without calling the service", async () => {
    const res = await request(app).post("/login").send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(loginUser).not.toHaveBeenCalled();
  });

  it("returns 401 when the service rejects with invalid credentials", async () => {
    vi.mocked(loginUser).mockRejectedValue(new AppError("Invalid credentials", 401));

    const res = await request(app)
      .post("/login")
      .send({ email: "ada@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid credentials" });
  });
});

describe("POST /refresh", () => {
  it("returns 200 with a rotated token pair", async () => {
    vi.mocked(refreshTokens).mockResolvedValue(fakeTokens);

    const res = await request(app).post("/refresh").send({ refreshToken: "some-refresh-token" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeTokens);
    expect(refreshTokens).toHaveBeenCalledWith("some-refresh-token");
  });

  it("returns 400 for a missing refresh token without calling the service", async () => {
    const res = await request(app).post("/refresh").send({});

    expect(res.status).toBe(400);
    expect(refreshTokens).not.toHaveBeenCalled();
  });

  it("returns 401 when the service detects refresh token reuse", async () => {
    vi.mocked(refreshTokens).mockRejectedValue(
      new AppError("Refresh token reuse detected", 401),
    );

    const res = await request(app).post("/refresh").send({ refreshToken: "stale-token" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Refresh token reuse detected" });
  });
});
