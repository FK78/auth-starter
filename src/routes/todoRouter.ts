import express from "express"
import { validate } from "../middleware/validate.ts"
import { createNote } from "../controllers/todoController.ts";

const router = express.Router()

router.post("/todos", validate(["title", "description", "userId"]), createNote)

export default router;