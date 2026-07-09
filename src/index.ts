import express from "express"
import userRouter from "./routes/userRouter.ts"

const port = process.env.TUDO_PORT || 3000
const app = express()

app.use(express.json())

app.use("/", userRouter)

app.listen(port, () => {
    console.log(`Server is online at port ${port}`)
})