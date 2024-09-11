import { Router } from "express"
import { downloadVideo, getInnertube } from "../../utils/youtube/downloader"
import { transformReadStream } from "../../utils/youtube/transformReadStream"
import { Constants } from "youtubei.js"

const youtube = Router()

youtube.get("/:id", async (req, res) => {
    const videoId = req.params.id

    const vid = await downloadVideo(videoId)
    const total = vid.data.content_length!

    const tube = await getInnertube()

    const abort = new AbortController()

    if(req.headers.range) {
        const [partStart, partEnd] = req.headers.range.replace(/bytes=/, "").split("-")
        const start = parseInt(partStart, 10)
        const end = partEnd ? parseInt(partEnd, 10) : total - 1
        const size = (end - start) + 1

        try {
            const { body } = await tube.session.http.fetch_function(`${vid.data.url!}&cpn=${vid.info.cpn}&range=${start}-${end}`, {
                headers: Constants.STREAM_HEADERS,
                method: "GET",
                signal: abort.signal
            })

            const readable = await transformReadStream(body!)

            res.writeHead(start === 0 ? 200 : 206, {
                "content-range": `bytes=${start}-${end}/${total}`,
                "accept-ranges": "bytes",
                "content-type": vid.data.mime_type,
                "content-length": size
            })

            readable.pipe(res)
        } catch (e) {
            console.log(e)
            res.status(500).json({
                "message": "internal server error"
            })
        }
    } else {
        const { body } = await tube.session.http.fetch_function(`${vid.data.url!}&cpn=${vid.info.cpn}`, {
            headers: Constants.STREAM_HEADERS,
            method: "GET",
            signal: abort.signal
        })
        const readable = await transformReadStream(body!)

        res.writeHead(200, {
            "content-type": vid.data.mime_type,
            "content-length": total
        })

        readable.pipe(res)
    }
})

export default youtube