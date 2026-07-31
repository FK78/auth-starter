import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { rateLimiter } from "./rateLimiter.ts";

const fakeRes = () => {
  const res = {
    set: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

const fakeReq = (ip = "1.2.3.4") => ({ ip }) as Request;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimiter", () => {
  it("allows a request within the limit and sets rate limit headers", () => {
    const limiter = rateLimiter(60_000, 3);
    const res = fakeRes();
    const next = vi.fn();

    limiter(fakeReq(), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.set).toHaveBeenCalledWith("X-RateLimit-Limit", "3");
    expect(res.set).toHaveBeenCalledWith("X-RateLimit-Remaining", "2");
  });

  it("blocks the request once maxTries is exceeded within the window", () => {
    const limiter = rateLimiter(60_000, 2);
    const req = fakeReq();

    limiter(req, fakeRes(), vi.fn());
    limiter(req, fakeRes(), vi.fn());

    const res = fakeRes();
    const next = vi.fn();
    limiter(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: "Too Many Requests" });
    expect(res.set).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  it("tracks separate keys independently", () => {
    const limiter = rateLimiter(60_000, 1);

    const resA = fakeRes();
    limiter(fakeReq("1.1.1.1"), resA, vi.fn());
    const resA2 = fakeRes();
    const nextA2 = vi.fn();
    limiter(fakeReq("1.1.1.1"), resA2, nextA2);

    const resB = fakeRes();
    const nextB = vi.fn();
    limiter(fakeReq("2.2.2.2"), resB, nextB);

    expect(nextA2).not.toHaveBeenCalled();
    expect(nextB).toHaveBeenCalledOnce();
  });

  it("uses keyFn instead of req.ip when provided", () => {
    const limiter = rateLimiter(60_000, 1, (req) => `custom:${req.ip}`);

    limiter(fakeReq("1.1.1.1"), fakeRes(), vi.fn());

    const res = fakeRes();
    const next = vi.fn();
    limiter(fakeReq("1.1.1.1"), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it("resets the count once the window has elapsed", () => {
    const limiter = rateLimiter(60_000, 1);
    const req = fakeReq();

    limiter(req, fakeRes(), vi.fn());

    const blockedRes = fakeRes();
    const blockedNext = vi.fn();
    limiter(req, blockedRes, blockedNext);
    expect(blockedNext).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_001);

    const allowedRes = fakeRes();
    const allowedNext = vi.fn();
    limiter(req, allowedRes, allowedNext);

    expect(allowedNext).toHaveBeenCalledOnce();
  });
});
