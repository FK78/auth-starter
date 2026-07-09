import express  from "express"
import { createUserController } from "../controllers/userController.ts"

const router = express.Router()

router.post("/register", createUserController)

export default router