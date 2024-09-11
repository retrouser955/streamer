import express from "express"

// sources
import youtube from "./sources/youtube/route"

const PORT = process.env.PORT || 3000

const app = express()

app.use("/youtube", youtube)

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))