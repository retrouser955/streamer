import { PassThrough } from "node:stream"
import { Utils } from "youtubei.js";

export function transformReadStream(stream: ReadableStream<Uint8Array>) {
    const passthrough = new PassThrough({
        highWaterMark: 1024 * 512
    });

    (async () => {
        let shouldListen = true

        for await (const chunk of Utils.streamToIterable(stream)) {
            if(passthrough.destroyed) continue;

            const shouldWrite = passthrough.write(chunk)
    
            if(!shouldWrite && shouldListen) {
                shouldListen = false
                await new Promise<void>(res => {
                    passthrough.once("drain", () => {
                        shouldListen = true
                        res()
                    })
                })
            }
        }
    })()

    passthrough._destroy = () => {
        stream.cancel()
        passthrough.destroyed = true
        passthrough.destroy()
    };

    return passthrough
}