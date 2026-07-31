import { app } from "./app.ts";
import { pool } from "./db/db.ts";
import { env } from "./config/env.ts";
import { logger } from "./utils/logger.ts";

try {
  await pool.query("SELECT 1");
  logger.info("DB Connected");
} catch (err) {
  logger.error(err);
  process.exit(1);
}

app.listen(env.PORT, () => {
  logger.info(`Server is online at port ${env.PORT}`);
});
