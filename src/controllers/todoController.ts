import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { insertNote } from "../services/todoService.ts";

// Verify token in middleware
// If user is legit then proceed
// Get requesting user ID

export const createNote = async (req: Request, res: Response) => {
  const accessToken = req.body.accessToken;

  try {
    const result = await insertNote(req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      console.error(`Note creation failed: ${err.message}`);
      return res.status(err.statusCode).json({ error: "Note creation failed" });
    }
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({ err: "Internal Server Error" });
  }
};
