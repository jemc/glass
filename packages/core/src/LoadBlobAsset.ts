import { LoadAsset } from "./LoadAsset"

export class LoadBlobAsset extends LoadAsset<Blob> {
  load() {
    const asset = this
    const req = new XMLHttpRequest()
    req.responseType = "blob"
    req.onload = () => asset.finished(req.response)
    req.open("GET", asset.url + "?cb=" + Date.now(), true)
    req.send()
  }
}
