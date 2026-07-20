import express  from "express"
import { register, login, refresh, test } from "../controllers/authController.ts"
import { validate } from "../middleware/validate.ts"
import { authAndAuth } from "../middleware/authenticate.ts"

const router = express.Router()

router.post("/register", validate(["name", "email", "password"]), register)
router.post("/login", validate(["email", "password"]), login)
router.post("/refresh", validate(["refreshToken"]), refresh)
router.get("/test", authAndAuth, test)


export default router