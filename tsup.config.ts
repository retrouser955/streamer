import { defineConfig } from "tsup"

export default defineConfig({
    dts: false,
    format: "cjs",
    entry: ["./src/index.ts"]
})