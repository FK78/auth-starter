import { Pool, type PoolClient } from 'pg'
 
export const pool = new Pool({
  host: process.env.HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DB,
})

export const withTransaction = async (fn: (client: PoolClient) => Promise<T>): Promise<T> => {
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
      console.error(`Rollback failed: ${rollbackErr}`)
    }
    throw err
  } finally {
    client.release();
  }
}