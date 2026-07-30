import z from "zod";
import { logger } from "../utils/logger.ts";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("localhost"),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),
  ACCESS_TOKEN_SECRET: z.string().min(1),
  ALLOWED_ORIGINS: z.string().optional()
});

const result = envSchema.safeParse(process.env);

if (!result.success){
    const issues = result.error.issues.map((i) => ` ${i.path.join(".")}: ${i.message}`)
    logger.error("Invalid environment configuration:\n" + issues.join("\n"))
    process.exit(1)
}

export const env = result.data