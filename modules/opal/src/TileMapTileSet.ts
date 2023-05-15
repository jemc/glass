import Aseprite from "ase-parser"
import { Vector2 } from "@glass/core"
import { Render } from "./Render"
import { TextureSurface } from "./TextureSurface"

export class TileMapTileSet {
  private tileset: Aseprite.Tileset
  private rawTilesetData: Buffer

  readonly tileSize: Vector2

  constructor(
    private ase: Aseprite,
    readonly index: number,
  ) {
    const tileset = ase.tilesets[index]
    if (!tileset) throw new Error(`Aseprite has no tileset at index ${index}`)
    this.tileset = tileset

    const { rawTilesetData } = tileset
    if (!rawTilesetData)
      throw new Error("External file Aseprite tileset not yet implemented")
    this.rawTilesetData = rawTilesetData

    this.tileSize = new Vector2(tileset.tileWidth, tileset.tileHeight)
  }

  get tileWidth() {
    return this.tileSize.x
  }

  get tileHeight() {
    return this.tileSize.y
  }

  assertTileSize(expectedSize: number) {
    const { tileWidth, tileHeight } = this
    if (tileWidth !== expectedSize || tileHeight !== expectedSize)
      throw new Error(
        `Tileset has unexpected tile size ${tileWidth}x${tileHeight}`,
      )
  }

  makeTextureSurface(render: Render): TextureSurface {
    if (this.ase.colorDepth !== 32)
      throw new Error("Only 32-bit tilesets are supported currently")

    const { tileHeight, tileWidth } = this
    const tilesPerRow = 1 // TODO: not hard-coded
    const pixelsPerTile = tileWidth * tileHeight
    const pixelsPerTileRow = pixelsPerTile * tilesPerRow
    const totalWidth = tileWidth * tilesPerRow
    const totalHeight = 16 * 255 // TODO: not hard-coded

    const imageData = new ImageData(totalWidth, totalHeight)
    this.rawTilesetData.forEach((byte, byteIndex) => {
      const pixelIndex = Math.floor(byteIndex / 4)
      const interPixelIndex = byteIndex % 4

      const subX = pixelIndex % tileWidth
      const subY = Math.floor((pixelIndex % pixelsPerTile) / tileWidth)
      const tileRow = Math.floor(pixelIndex / pixelsPerTileRow)
      const tileCol = Math.floor(
        (pixelIndex % pixelsPerTileRow) / pixelsPerTile,
      )

      const destPixelIndex =
        subX +
        tileCol * tileWidth +
        subY * totalWidth +
        tileRow * tileHeight * totalWidth

      const destByteIndex = destPixelIndex * 4 + interPixelIndex

      imageData.data[destByteIndex] = byte
    })

    const texture = TextureSurface.fromImage(render, imageData)
    return texture
  }
}
