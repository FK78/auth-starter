import express  from "express"
import { register, login, refresh } from "../controllers/authController.ts"
import { validate } from "../middleware/validate.ts"

const router = express.Router()

router.post("/register", validate(["name", "email", "password"]), register)
router.post("/login", validate(["email", "password"]), login)
router.post("/refresh", validate(["refreshToken"]), refresh)


export default router