import express from "express";
import authRouter from "./routes/auth.router.ts";
import healthRouter from "./routes/health.router.ts";
import cors from "cors";
import { pool } from "./db/db.ts";
import { errorHandler, routeNotFound } from "./middleware/errorHandler.ts";
import { env } from "./config/env.ts";
import { pinoHttp } from "pino-http";
import { logger } from "./utils/logger.ts";

const port = env.PORT;
const app = express();
app.use(pinoHttp({logger}))
const allowedOrigins = (env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  }),
);

app.set("trust proxy", 1);
app.use(express.json());

try {
  await pool.query("SELECT 1");
  logger.info("DB Connected");
} catch (err) {
  logger.error(err);
  process.exit(1);
}

app.use(authRouter);
app.use(healthRouter);

app.use(routeNotFound);
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server is online at port ${port}`);
});
