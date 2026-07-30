import { Pool, type PoolClient } from 'pg'
import { env } from '../config/env.ts'
import { logger } from '../utils/logger.ts'
 
export const pool = new Pool({
  host: env.HOST,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
})

export const withTransaction = async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect()
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT")
    return result
  } catch (err) {
    try {
      await client.query("ROLLBACK")
    } catch (rollbackErr) {
      logger.error(rollbackErr, "Rollback failed")
    }
    throw err
  } finally {
    client.release();
  }
}