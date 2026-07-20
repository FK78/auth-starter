import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError === false) {
        console.error(`Internal Server Error ${err}`)
        return res
            .status(500)
            .json({ error: `Internal Server Error` });
    }
    return res.status(err.statusCode).json({ error: err.message })
}

export const routeNotFound = (req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found" })
}