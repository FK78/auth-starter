import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodError, ZodType } from "zod";
import { AppError } from "../errors/AppError.ts";

export interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

interface FieldIssue {
  field: string;
  message: string;
}

const collectIssues = (source: string, error: ZodError): FieldIssue[] =>
  error.issues.map((issue) => ({
    field: issue.path.length ? `${source}.${issue.path.join(".")}` : source,
    message: issue.message,
  }));

export const validate = (schemas: ValidationSchemas): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const issues: FieldIssue[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        issues.push(...collectIssues("body", result.error));
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        issues.push(...collectIssues("query", result.error));
      } else {
        Object.defineProperty(req, "query", {
          value: result.data,
          writable: true,
          configurable: true,
        });
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        issues.push(...collectIssues("params", result.error));
      } else {
        Object.assign(req.params, result.data);
      }
    }

    if (issues.length > 0) {
      const message = issues.map((i) => `${i.field}: ${i.message}`).join("; ");
      throw new AppError(message, 400);
    }
    next();
  };