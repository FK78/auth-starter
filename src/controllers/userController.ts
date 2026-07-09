import type { Request, Response } from "express";
import { loginUser, registerUser } from "../services/userService.ts";
import { AppError } from "../errors/AppError.ts";

export const createUserController = async (req: Request, res: Response) => {
  try {
    const response = await registerUser(req.body);
    return res.status(201).json({ token: response });
  } catch (err) {
    if (err instanceof AppError) {
      console.error(`Registration error: ${err.message}`);
      return res.status(err.statusCode).json({ error: "Registration failed" });
    }
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserController = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken }= await loginUser(req.body);
    return res.status(201).json({ accessToken, refreshToken});
  } catch (err) {
    if (err instanceof AppError) {
      console.error(`Registration error: ${err.message}`);
      return res.status(err.statusCode).json({ error: "Registration failed" });
    }
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
