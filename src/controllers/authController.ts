import type { Request, Response } from "express";
import { loginUser, registerUser } from "../services/authService.ts";
import { AppError } from "../errors/AppError.ts";

export const register = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = await registerUser(req.body);
    return res.status(201).json({ accessToken, refreshToken });
  } catch (err) {
    if (err instanceof AppError) {
      console.error(`Registration error: ${err.message}`);
      return res.status(err.statusCode).json({ error: "Registration failed" });
    }
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = await loginUser(req.body);
    return res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    if (err instanceof AppError) {
      console.error(`Login error: ${err.message}`);
      return res.status(err.statusCode).json({ error: "Login failed" });
    }
    console.error(`Internal server error: ${err}`);
    return res.status(500).json({ error: "Internal server error" });
  }
};
