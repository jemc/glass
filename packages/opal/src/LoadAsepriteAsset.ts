import { Buffer } from "buffer"
import { LoadAsset } from "@glass/core"
import Aseprite from "ase-parser"

export abstract class LoadAsepriteAsset extends LoadAsset<Aseprite> {
  load() {
    const asset = this
    const req = new XMLHttpRequest()
    req.open("GET", asset.url, true)
    req.responseType = "blob"
    req.onload = () => {
      const blob: Blob = req.response
      blob.arrayBuffer().then((arrayBuffer) => {
        const buffer = Buffer.from(arrayBuffer)
        const data = new Aseprite(buffer, asset.url)
        data.parse()
        asset.finished(data)
      })
    }
    req.send()
  }
}
