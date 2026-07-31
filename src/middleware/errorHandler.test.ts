import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { errorHandler, routeNotFound } from "./errorHandler.ts";
import { AppError } from "../errors/AppError.ts";

const fakeRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

const fakeReq = () =>
  ({ log: { error: vi.fn() } }) as unknown as Request;

describe("errorHandler", () => {
  it("responds with the AppError's own status and message, without logging", () => {
    const req = fakeReq();
    const res = fakeRes();
    const err = new AppError("Invalid credentials", 401);

    errorHandler(err, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    expect(req.log.error).not.toHaveBeenCalled();
  });

  it("respects a self-describing HTTP error's own status, without logging", () => {
    const req = fakeReq();
    const res = fakeRes();
    const err = Object.assign(new SyntaxError("Unexpected token in JSON"), {
      statusCode: 400,
      expose: true,
    });

    errorHandler(err, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid request" });
    expect(req.log.error).not.toHaveBeenCalled();
  });

  it("logs and responds with a generic 500 for a non-AppError", () => {
    const req = fakeReq();
    const res = fakeRes();
    const err = new TypeError("something broke");

    errorHandler(err, req, res, vi.fn());

    expect(req.log.error).toHaveBeenCalledWith(err, "Internal Server Error");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});

describe("routeNotFound", () => {
  it("responds with a 404", () => {
    const res = fakeRes();

    routeNotFound({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Route not found" });
  });
});
