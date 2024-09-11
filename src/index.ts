import express from "express"
import "dotenv/config"

// sources
import youtube from "./sources/youtube/route"

const PORT = process.env.PORT || 3000

const app = express()

app.use("/youtube", youtube)

app.listen(process.env.PORT || 3000, () => console.log(`Listening on port: ${PORT}`))