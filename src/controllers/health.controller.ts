import type { Request, Response } from "express";
import { checkDatabaseHealth } from "../services/health.service.ts";

export const health = async (req: Request, res: Response) => {
  await checkDatabaseHealth();
  res.status(200).json({ status: "ok" });
};