import Aseprite from "ase-parser"
import { Uint32Array2D, Vector2 } from "@glass/core"
import { Render } from "./Render"
import { TextureSurface } from "./TextureSurface"
import { TileMap } from "./TileMap"
import { TileMapTileSet } from "./TileMapTileSet"

// Parse a user data string associated with a tilemap layer's cel (in Aseprite).
//
// The user data string is a URL-encoded query string that supports certain
// patterns, including the following examples of usage:
//
// animate=1,2,3,4 // tiles 1, 2, 3, and 4 are an animation cycle
//
// 5=ladder // tile 5 is a special tile of kind "ladder"
// 6=foo // tile 6 is a special tile of kind "foo" (arbitrary)
//
// 7=spawn:final-boss // tile 7 is special: category "spawn", kind "final-boss"
// 7=foo:bar // tile 8 is a specialL category "foo", kind "bar" (arbitrary)
export class TileMapLayerUserData {
  specialTiles: { [id: number]: { kind: string; category?: string } } = {}
  animate: number[][] = []

  constructor(userDataText: string | undefined) {
    const userDataParams = new URLSearchParams(userDataText)
    for (const [key, value] of userDataParams) {
      // Handle animation user data, if present.
      if (key === "animate") {
        this.animate.push(value.split("=").map(Number.parseInt))
        continue
      }

      // Handle special tile user data, if present.
      const numberKey = Number.parseInt(key)
      if (!Number.isNaN(numberKey)) {
        var [first, second] = value.split(":", 2)
        if (second) {
          this.specialTiles[numberKey] = { kind: second, category: first }
        } else {
          this.specialTiles[numberKey] = { kind: first ?? "" }
        }
        continue
      }

      console.warn(`Unhandled tilemap layer user data: ${key}=${value}`)
    }
  }
}

export class TileMapLayer {
  private layer: Aseprite.Layer
  private cel: Aseprite.Cel
  private tilesetIndex: number
  readonly tileIds: Uint32Array2D
  readonly userData: TileMapLayerUserData
  readonly tileset: TileMapTileSet

  constructor(
    private ase: Aseprite,
    private tileMap: TileMap,
    readonly name: string,
  ) {
    // Get the layer with the given name.
    const layerIndex = this.ase.layers.findIndex((layer) => layer.name === name)
    const layer = this.ase.layers[layerIndex]
    if (!layer) throw new Error(`Aseprite data has no ${name} layer`)
    this.layer = layer

    // Get the cel for that layer in frame zero.
    const cel = this.ase.frames[0]?.cels.find(
      (cel) => cel.layerIndex === layerIndex,
    )
    if (!cel) throw new Error(`Aseprite ${name} layer has no cel in frame zero`)
    this.cel = cel

    // Get the tileset for that layer.
    const { tilesetIndex } = this.layer
    if (tilesetIndex === undefined)
      throw new Error(`Aseprite ${name} layer is not a tilemap`)
    this.tilesetIndex = tilesetIndex
    this.tileset = this.tileMap.tileset(this.tilesetIndex)

    // Get the tilemap metadata for that cel.
    const { tilemapMetadata } = this.cel
    if (!tilemapMetadata)
      throw new Error(`Aseprite ${name} layer has no tilemap metadata`)

    // Get the tilemap data for that cel.
    if (tilemapMetadata.bitsPerTile !== 32)
      throw new Error(`Aseprite tilemap ${name} is not 32-bit`)
    this.tileIds = new Uint32Array2D(
      new Vector2(cel.w, cel.h),
      new Vector2(
        Math.floor(this.cel.xpos / this.tileset.tileWidth),
        Math.floor(this.cel.ypos / this.tileset.tileHeight),
      ),
    )
    new Uint32Array(cel.rawCelData.buffer).forEach((tileBits, index) => {
      const startX = this.cel.xpos / this.tileset.tileWidth
      const startY = this.cel.ypos / this.tileset.tileHeight
      const x = (index % this.cel.w) + startX
      const y = (index - x + startX) / this.cel.w + startY
      let tile = tileBits & tilemapMetadata.bitmaskForTileId

      this.tileIds.set(x, y, tile)
    })

    // Parse the user data for the cel, which is used for the whole layer.
    this.userData = new TileMapLayerUserData(this.cel.userDataText)

    // Get the associated tileset.
  }

  makeDataTextureSurface(render: Render): TextureSurface {
    return new TextureSurface(render, this.tileIds.size, this.tileIds)
  }
}
