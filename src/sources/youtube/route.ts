import { Router } from "express"
import { downloadVideo, getInnertube } from "../../utils/youtube/downloader"
import { transformReadStream } from "../../utils/youtube/transformReadStream"
import { Constants, Platform, Utils } from "youtubei.js"
import type Innertube from "youtubei.js"

const youtube = Router()

function createWebReadableStream(
    url: string,
    size: number,
    innertube: Innertube,
    downloadStart?: number
  ) {
    let [start, end] = [downloadStart || 0, 1048576 * 10];
    let isEnded = false;
  
    let abort: AbortController;
  
    // all credits go to [LuanRT](https://github.com/LuanRT/YouTube.js/blob/main/src/utils/FormatUtils.ts)
    return new Platform.shim.ReadableStream<Uint8Array>(
      {
        start() {},
        pull(controller) {
          if (isEnded) {
            controller.close();
            return;
          }
  
          if (end >= size) {
            isEnded = true;
          }
  
          return new Promise(async (resolve, reject) => {
            abort = new AbortController();
            try {
              const chunks = await innertube.actions.session.http.fetch_function(
                `${url}&range=${start}-${end || ""}`,
                {
                  headers: {
                    ...Constants.STREAM_HEADERS,
                  },
                  signal: abort.signal,
                },
              );
  
              const readable = chunks.body;
  
              if (!readable || !chunks.ok)
                throw new Error(`Downloading of ${url} failed.`);
  
              for await (const chunk of Utils.streamToIterable(readable)) {
                controller.enqueue(chunk);
              }
  
              start = end + 1;
              end += end;
  
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        },
        async cancel() {
          abort.abort();
        },
      },
      {
        highWaterMark: 1,
        size(ch) {
          return ch.byteLength;
        },
      },
    );
  }

youtube.get("/:id", async (req, res) => {
    const videoId = req.params.id

    const vid = await downloadVideo(videoId)
    const total = vid.data.content_length!

    const tube = await getInnertube()

    if(req.headers.range) {
        let [partStart, partEnd] = req.headers.range.replace(/bytes=/, "").split("-")
        let start = parseInt(partStart, 10)
        let end = partEnd ? parseInt(partEnd, 10) : total - 1
        
        const webReadable = createWebReadableStream(
            `${vid.data}&cpn=${vid.info.cpn}`,
            end,
            tube,
            start || 0
        )

        const readable = transformReadStream(webReadable)

        readable.pipe(res)
    } else {
        const webReadable = createWebReadableStream(
            `${vid.data}&cpn=${vid.info.cpn}`,
            total,
            tube
        )

        const readable = transformReadStream(webReadable)

        readable.pipe(res)
    }
})

export default youtube