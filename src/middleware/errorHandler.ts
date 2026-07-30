import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError === false) {
        req.log.error(err, "Internal Server Error")
        return res
            .status(500)
            .json({ error: `Internal Server Error` });
    }
    return res.status(err.statusCode).json({ error: err.message })
}

export const routeNotFound = (_req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found" })
}