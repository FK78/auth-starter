import express from "express"
import authRouter from "./routes/authRouter.ts"
import todoRouter from "./routes/todoRouter.ts"
import { pool } from "./db/db.ts"

const port = process.env.TUDO_PORT || 3000
const app = express()

app.use(express.json())

try {
  await pool.query("SELECT 1");
  console.log("DB Connected");
} catch (err) {
  console.error(err);
  process.exit(1);
}

app.use("/", authRouter)
app.use("/", todoRouter)

app.listen(port, () => {
    console.log(`Server is online at port ${port}`)
})