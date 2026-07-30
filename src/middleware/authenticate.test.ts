import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { authenticate } from "./authenticate.ts";
import { AppError } from "../errors/AppError.ts";
import { env } from "../config/env.ts";

const sign = (payload: object, overrides: jwt.SignOptions = {}) =>
  jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    issuer: "auth-starter",
    audience: "auth-starter-api",
    expiresIn: "15m",
    ...overrides,
  });

const fakeReq = (authHeader?: string) =>
  ({ headers: { authorization: authHeader } }) as unknown as Request;

describe("authenticate", () => {
  it("throws when there is no Authorization header", async () => {
    await expect(authenticate(fakeReq(), {} as Response, vi.fn())).rejects.toThrow(AppError);
  });

  it("throws when the Authorization header isn't a Bearer token", async () => {
    await expect(
      authenticate(fakeReq("Basic abc123"), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("sets req.user and calls next() for a valid access token", async () => {
    const token = sign({ sub: "user-1", type: "access" });
    const req = fakeReq(`Bearer ${token}`);
    const next = vi.fn();

    await authenticate(req, {} as Response, next);

    expect(req.user).toEqual({ id: "user-1" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("throws for a token signed with the wrong secret", async () => {
    const token = jwt.sign({ sub: "user-1", type: "access" }, "wrong-secret", {
      issuer: "auth-starter",
      audience: "auth-starter-api",
    });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("throws for a token with the wrong issuer", async () => {
    const token = sign({ sub: "user-1", type: "access" }, { issuer: "someone-else" });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("throws for an expired token", async () => {
    const token = sign({ sub: "user-1", type: "access" }, { expiresIn: "-1s" });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("throws when the token type isn't 'access'", async () => {
    const token = sign({ sub: "user-1", type: "refresh" });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("throws for an unsigned alg: none token, even with a valid-looking payload", async () => {
    const token = jwt.sign({ sub: "user-1", type: "access" }, null, {
      algorithm: "none",
      issuer: "auth-starter",
      audience: "auth-starter-api",
      expiresIn: "15m",
    });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("throws for a token signed with the right secret but a different algorithm", async () => {
    const token = jwt.sign({ sub: "user-1", type: "access" }, env.ACCESS_TOKEN_SECRET, {
      algorithm: "HS384",
      issuer: "auth-starter",
      audience: "auth-starter-api",
      expiresIn: "15m",
    });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });

  it("throws when the token has no sub claim", async () => {
    const token = sign({ type: "access" });

    await expect(
      authenticate(fakeReq(`Bearer ${token}`), {} as Response, vi.fn()),
    ).rejects.toThrow(AppError);
  });
});
