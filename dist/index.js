"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_express2 = __toESM(require("express"));

// src/sources/youtube/route.ts
var import_express = require("express");

// src/utils/youtube/downloader.ts
var import_youtubei = __toESM(require("youtubei.js"));
var tube;
async function getInnertube() {
  if (!tube) tube = await import_youtubei.default.create();
  return tube;
}
async function downloadVideo(id) {
  const tube2 = await getInnertube();
  const info = await tube2.getBasicInfo(id, "IOS");
  const streamData = info.chooseFormat({ type: "audio", quality: "best", format: "mp4" });
  return {
    info,
    data: streamData
  };
}

// src/utils/youtube/transformReadStream.ts
var import_node_stream = require("stream");
var import_youtubei2 = require("youtubei.js");
async function transformReadStream(stream) {
  const passthrough = new import_node_stream.PassThrough({
    highWaterMark: 1024 * 512
  });
  (async () => {
    let shouldListen = true;
    for await (const chunk of import_youtubei2.Utils.streamToIterable(stream)) {
      if (passthrough.destroyed) continue;
      const shouldWrite = passthrough.write(chunk);
      if (!shouldWrite && shouldListen) {
        shouldListen = false;
        await new Promise((res) => {
          passthrough.once("drain", () => {
            shouldListen = true;
            res();
          });
        });
      }
    }
  })();
  passthrough._destroy = () => {
    stream.cancel();
    passthrough.destroyed = true;
    passthrough.destroy();
  };
  return passthrough;
}

// src/sources/youtube/route.ts
var import_youtubei3 = require("youtubei.js");
var youtube = (0, import_express.Router)();
youtube.get("/:id", async (req, res) => {
  const videoId = req.params.id;
  const vid = await downloadVideo(videoId);
  const total = vid.data.content_length;
  const tube2 = await getInnertube();
  const abort = new AbortController();
  if (req.headers.range) {
    const [partStart, partEnd] = req.headers.range.replace(/bytes=/, "").split("-");
    const start = parseInt(partStart, 10);
    const end = partEnd ? parseInt(partEnd, 10) : total - 1;
    const size = end - start + 1;
    try {
      const { body } = await tube2.session.http.fetch_function(`${vid.data.url}&cpn=${vid.info.cpn}&range=${start}-${end}`, {
        headers: import_youtubei3.Constants.STREAM_HEADERS,
        method: "GET",
        signal: abort.signal
      });
      const readable = await transformReadStream(body);
      res.writeHead(start === 0 ? 200 : 206, {
        "content-range": `bytes=${start}-${end}/${total}`,
        "accept-ranges": "bytes",
        "content-type": vid.data.mime_type,
        "content-length": size
      });
      readable.pipe(res);
    } catch (e) {
      console.log(e);
      res.status(500).json({
        "message": "internal server error"
      });
    }
  } else {
    const { body } = await tube2.session.http.fetch_function(`${vid.data.url}&cpn=${vid.info.cpn}`, {
      headers: import_youtubei3.Constants.STREAM_HEADERS,
      method: "GET",
      signal: abort.signal
    });
    const readable = await transformReadStream(body);
    res.writeHead(200, {
      "content-type": vid.data.mime_type,
      "content-length": total
    });
    readable.pipe(res);
  }
});
var route_default = youtube;

// src/index.ts
var PORT = process.env.PORT || 3e3;
var app = (0, import_express2.default)();
app.use("/youtube", route_default);
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
