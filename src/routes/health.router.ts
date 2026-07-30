import { Router } from "express"
import { health } from "../controllers/health.controller.ts"

const router = Router()

router.get("/health", health)

export default router