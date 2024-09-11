import Innertube from "youtubei.js";
import { getImport } from "../json/configImporter";
import { tokenToObject } from "./tokenizer";

let tube: Innertube;

export async function getInnertube() {
    if(!tube) {
        const [innertube, config] = await Promise.all([Innertube.create({ retrieve_player: false }), getImport()])
        tube = innertube
        if(config.youtube.cookie) {
            const obj = tokenToObject(config.youtube.cookie as string)
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