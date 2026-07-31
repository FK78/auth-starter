import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import express from "express";
import request from "supertest";
import type { Request, Response } from "express";
import { validate } from "./validate.ts";
import { AppError } from "../errors/AppError.ts";

const fakeReq = (overrides: Partial<Request> = {}) =>
  ({ body: {}, query: {}, params: {}, ...overrides }) as Request;

const fakeRes = () => ({}) as Response;

describe("validate", () => {
  it("calls next() and replaces req.body with parsed data when valid", () => {
    const schema = z.object({ email: z.string().trim() });
    const req = fakeReq({ body: { email: "  ada@example.com  " } });
    const next = vi.fn();

    validate({ body: schema })(req, fakeRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ email: "ada@example.com" });
  });

  it("throws an AppError with a 400 status when the body is invalid", () => {
    const schema = z.object({ email: z.email() });
    const req = fakeReq({ body: { email: "not-an-email" } });
    const next = vi.fn();

    expect(() => validate({ body: schema })(req, fakeRes(), next)).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });

  it("prefixes issue fields with the source name", () => {
    const schema = z.object({ email: z.email() });
    const req = fakeReq({ body: { email: "not-an-email" } });

    try {
      validate({ body: schema })(req, fakeRes(), vi.fn());
      expect.unreachable("expected validate to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).message).toContain("body.email");
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it("replaces req.query with parsed data on a plain object (no Express getter involved)", () => {
    const schema = z.object({ page: z.coerce.number() });
    const req = fakeReq({ query: { page: "2" } });

    validate({ query: schema })(req, fakeRes(), vi.fn());

    expect(req.query.page).toBe(2);
  });

  it("merges valid params values into req.params", () => {
    const schema = z.object({ id: z.string() });
    const req = fakeReq({ params: { id: "abc" } });
    const next = vi.fn();

    validate({ params: schema })(req, fakeRes(), next);

    expect(req.params.id).toBe("abc");
    expect(next).toHaveBeenCalledOnce();
  });

  it("combines issues from multiple sources with a semicolon", () => {
    const req = fakeReq({ body: { email: "not-an-email" }, params: { id: "" } });

    try {
      validate({
        body: z.object({ email: z.email() }),
        params: z.object({ id: z.string().min(1) }),
      })(req, fakeRes(), vi.fn());
      expect.unreachable("expected validate to throw");
    } catch (err) {
      expect((err as AppError).message).toContain("body.email");
      expect((err as AppError).message).toContain("params.id");
      expect((err as AppError).message).toContain("; ");
    }
  });
});

describe("validate (real Express request, not a fake object)", () => {
  it("survives req.query's Express 5 getter so a later handler sees coerced values", async () => {
    const schema = z.object({ page: z.coerce.number() });
    const app = express();
    app.get("/check", validate({ query: schema }), (req, res) => {
      res.json({ page: req.query.page, type: typeof req.query.page });
    });

    const res = await request(app).get("/check?page=2");

    expect(res.body).toEqual({ page: 2, type: "number" });
  });
});
