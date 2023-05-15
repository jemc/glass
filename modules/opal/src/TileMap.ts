import Aseprite from "ase-parser"
import { registerComponent, Box2 } from "@glass/core"
import { TileMapLayer } from "./TileMapLayer"
import { TileMapTileSet } from "./TileMapTileSet"

export class TileMap {
  static readonly componentId = registerComponent(this)

  private layers = new Map<string, TileMapLayer>()
  private tilesets: TileMapTileSet[] = []

  constructor(
    public name: string,
    private ase: Aseprite,
  ) {}

  layer(name: string) {
    let layer = this.layers.get(name)
    if (layer) return layer

    layer = new TileMapLayer(this.ase, this, name)
    this.layers.set(name, layer)
    return layer
  }

  tileset(index: number) {
    let tileset = this.tilesets[index]
    if (tileset) return tileset

    tileset = new TileMapTileSet(this.ase, index)
    this.tilesets[index] = tileset
    return tileset
  }

  slice(name: string, frameNumber: number = 0) {
    const slice = this.ase.slices.find((slice) => slice.name === name)
    if (!slice) return undefined

    const key = slice.keys.find((key) => key.frameNumber === frameNumber)
    if (!key) return undefined

    return Box2.fromLeftTopWidthHeight(key.x, key.y, key.width, key.height)
  }

  forEachSlice(
    callback: (name: string, box: Box2) => void,
    frameNumber: number = 0,
  ) {
    this.ase.slices.forEach((slice) => {
      slice.keys.forEach((key) => {
        if (key.frameNumber === frameNumber) {
          callback(
            slice.name,
            Box2.fromLeftTopWidthHeight(key.x, key.y, key.width, key.height),
          )
        }
      })
    })
  }
}
