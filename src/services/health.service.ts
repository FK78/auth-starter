import { pool } from "../db/db.ts";
import { AppError } from "../errors/AppError.ts";
import { logger } from "../utils/logger.ts";

export const checkDatabaseHealth = async (): Promise<void> => {
  try {
    await pool.query(`SELECT * FROM MEEEE`);
  } catch (err) {
    logger.error("Health check database query failed:");
    throw new AppError("Service unavailable", 503);
  }
};