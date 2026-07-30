import type { Request, Response } from "express";
import { pool } from "../db/db.ts";

export const health = async (req: Request, res: Response) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({ status: "ok" });
    } catch (err){
        console.error("Health check database query failed:", err);
        res.status(503).json({ status: "Health check failed" })
    }
}