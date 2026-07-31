import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";

const isExposableHttpError = (
    err: Error,
): err is Error & { statusCode: number; expose: true } => {
    const candidate = err as { statusCode?: unknown; expose?: unknown };
    return typeof candidate.statusCode === "number" && candidate.expose === true;
};

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    if (isExposableHttpError(err)) {
        return res.status(err.statusCode).json({ error: "Invalid request" });
    }

    req.log.error(err, "Internal Server Error");
    return res.status(500).json({ error: "Internal Server Error" });
}

export const routeNotFound = (_req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found" })
}