import type { Request, Response } from "express";
import { pool } from "../db/db.ts";

export const health = async (_req: Request, res: Response) => {
        await pool.query("SELECT 1");
        res.status(200).json({ status: "ok" });
}