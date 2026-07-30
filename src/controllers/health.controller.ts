import type { Request, Response } from "express";
import { pool } from "../db/db.ts";

export const health = async (req: Request, res: Response) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({ status: "ok" });
    } catch {
        res.status(503).json({ status: "error "})
    }
}