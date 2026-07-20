import express from "express"
import { validate } from "../middleware/validate.ts"
import { createNote } from "../controllers/todoController.ts";
import { authenticate } from "../middleware/authenticate.ts";

const router = express.Router()

router.post("/todos", authenticate, validate(["title", "description"]), createNote)

export default router;