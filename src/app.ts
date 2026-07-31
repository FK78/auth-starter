import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import authRouter from "./routes/auth.router.ts";
import healthRouter from "./routes/health.router.ts";
import { errorHandler, routeNotFound } from "./middleware/errorHandler.ts";
import { env } from "./config/env.ts";
import { logger } from "./utils/logger.ts";

export const app = express();

app.use(pinoHttp({ logger }));

const allowedOrigins = (env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : false }));

app.set("trust proxy", 1);
app.use(express.json());

app.use(authRouter);
app.use(healthRouter);

app.use(routeNotFound);
app.use(errorHandler);
