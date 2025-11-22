import { registerComponent, MutableBox2 } from "@glass/core"
import { Context } from "./Context"

export class Body {
  static readonly componentId = registerComponent(this)

  readonly shape: Body.Shape
  private box = new MutableBox2()
  readonly tileMapName?: string
  readonly tileMapLayerName?: string

  constructor(
    opts: {
      shape?: Body.Shape
      offsetX?: number
      offsetY?: number
      width?: number
      height?: number
      tileMapName?: string
      tileMapLayerName?: string
    } = {},
  ) {
    this.shape = opts.shape ?? Body.Shape.Box

    this.box.radii.setTo(opts.width ?? 2, opts.height ?? 2).scaleEquals(0.5)
    this.box.center.setTo(opts.offsetX ?? 0, opts.offsetY ?? 0)

    if (this.shape === Body.Shape.TileMap) {
      if (!opts.tileMapName)
        throw new Error("TileMap shape requires tileMapName.")
      if (!opts.tileMapLayerName)
        throw new Error("TileMap shape requires tileMapLayerName.")
      this.tileMapName = opts.tileMapName
      this.tileMapLayerName = opts.tileMapLayerName
    }
  }

  updateBounds(
    width: number = 0,
    height: number = 0,
    offsetX: number = 0,
    offsetY: number = 0,
  ) {
    this.box.radii.setTo(width, height).scaleEquals(0.5)
    this.box.center.setTo(offsetX, offsetY)
  }

  get width() {
    return this.box.width
  }
  get height() {
    return this.box.height
  }
  get radii() {
    return this.box.radii
  }
  get offset() {
    return this.box.center
  }
  get offsetX() {
    return this.box.x
  }
  get offsetY() {
    return this.box.y
  }
  get relativeX0() {
    return this.box.x0
  }
  get relativeX1() {
    return this.box.x1
  }
  get relativeY0() {
    return this.box.y0
  }
  get relativeY1() {
    return this.box.y1
  }

  tileMapIsSolidInXYRange(
    coral: Context,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
  ): boolean {
    if (this.shape !== Body.Shape.TileMap)
      throw new TypeError("This is not a TileMap collision shape.")

    return (
      coral.opal.tileMaps
        .get(this.tileMapName!)
        ?.layer(this.tileMapLayerName!)
        ?.isNonZeroInXYRange(x0, x1, y0, y1) ?? false
    )
  }
}

export namespace Body {
  export enum Shape {
    Box = 0,
    // TODO: Circle,
    // TODO: Bitmap,
    TileMap,
  }
}
