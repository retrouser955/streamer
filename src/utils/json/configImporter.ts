import fs from "node:fs/promises"

let imported: Record<string, any>
export async function getImport() {
    if(!imported) imported = JSON.parse(await fs.readFile(`${process.cwd()}/config.json`, "utf-8"))
    return imported
}