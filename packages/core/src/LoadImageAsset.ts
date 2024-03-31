import { LoadAsset } from "./LoadAsset"

export class LoadImageAsset extends LoadAsset<HTMLImageElement> {
  load() {
    const asset = this
    const image = new Image()
    image.onload = () => asset.finished(image)
    image.crossOrigin = "anonymous"
    image.src = asset.url + "?cb=" + Date.now()
  }
}
