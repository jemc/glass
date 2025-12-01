import Aseprite from "ase-parser"
import { ReadVector2, Vector2 } from "@glass/core"
import { Render } from "./Render"
import { TextureSurface } from "./TextureSurface"

export interface TileMapTileSet {
  readonly tileSize: ReadVector2
  makeTextureSurface(render: Render): TextureSurface
}

export class TileMapTileSetAseprite implements TileMapTileSet {
  private tileset: Aseprite.Tileset
  private rawTilesetData: Buffer

  readonly tileSize: ReadVector2

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

  makeTextureSurface(render: Render): TextureSurface {
    if (this.ase.colorDepth !== 32)
      throw new Error("Only 32-bit tilesets are supported currently")

    const { x: tileWidth, y: tileHeight } = this.tileSize
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

export class TileMapTileSetTiled implements TileMapTileSet {
  readonly tileSize: ReadVector2

  constructor(
    xml: Document,
    private imageData: ImageData,
  ) {
    const tilesetTag = xml.getElementsByTagName("tileset")[0]
    if (!tilesetTag) throw new Error(`No <tileset> tag found in Tiled XML`)

    this.tileSize = new Vector2(
      parseInt(tilesetTag.getAttribute("tilewidth") || "16"),
      parseInt(tilesetTag.getAttribute("tileheight") || "16"),
    )

    // TODO: parse animation data in the XML
  }

  makeTextureSurface(render: Render): TextureSurface {
    // TODO: how to deal with the varying width/height of different source images?
    return TextureSurface.fromImage(render, this.imageData)
  }
}
