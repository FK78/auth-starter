import { pool } from "../db/db.ts";
import { AppError } from "../errors/AppError.ts";

export const checkDatabaseHealth = async (): Promise<void> => {
  try {
    await pool.query(`SELECT 1`);
  } catch (err) {
    console.error("Health check database query failed:", err);
    throw new AppError("Service unavailable", 503);
  }
};