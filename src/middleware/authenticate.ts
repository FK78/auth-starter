import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError.ts";
import { env } from "../config/env.ts";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Access token is required", 401);
  }
  const accessToken = authHeader.split(" ")[1]!;

  let payload: { sub: string; type: string };

  try {
    payload = jwt.verify(
      accessToken,
      env.ACCESS_TOKEN_SECRET!,
      { algorithms: ["HS256"], issuer: "express-starter", audience: "express-starter-api" }
    ) as unknown as typeof payload;
  } catch {
    throw new AppError("Invalid access token", 401);
  }

  if (payload.type !== "access" || !payload.sub) {
      throw new AppError("Invalid access token", 401);
  }
 
  req.user = { id: payload.sub };
  next();
};
