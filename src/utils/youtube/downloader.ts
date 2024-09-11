import Innertube from "youtubei.js";
import { tokenToObject } from "./tokenizer";

let tube: Innertube;

export async function getInnertube() {
    if(!tube) {
        tube = await Innertube.create({ retrieve_player: false })
        const config = process.env.YOUTUBE_COOKIE
        if(config) {
            const obj = tokenToObject(config as string)
            await tube.session.signIn(obj)
        }
    }

    return tube
}

export async function downloadVideo(id: string) {
    const tube = await getInnertube()

    const info = await tube.getBasicInfo(id, "IOS")

    const streamData = info.chooseFormat({ type: "audio", quality: "best", format: "mp4" })

    return {
        info,
        data: streamData
    }
}