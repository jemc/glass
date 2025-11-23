import { registerComponent, MutableBox2, ReadVector2 } from "@glass/core"
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
  x0From(vec: ReadVector2) {
    return vec.x + this.box.x0
  }
  x1From(vec: ReadVector2) {
    return vec.x + this.box.x1
  }
  y0From(vec: ReadVector2) {
    return vec.y + this.box.y0
  }
  y1From(vec: ReadVector2) {
    return vec.y + this.box.y1
  }

  checkOverlap(
    coral: Context,
    b: Body,
    posA: { coords: ReadVector2 },
    posB: { coords: ReadVector2 },
  ) {
    const a = this
    if (this.shape === Body.Shape.Box && b.shape === Body.Shape.Box) {
      const aX0 = a.x0From(posA.coords)
      const bX0 = b.x0From(posB.coords)
      const aX1 = a.x1From(posA.coords)
      const bX1 = b.x1From(posB.coords)
      if (aX0 >= bX1 || bX0 >= aX1) return false

      const aY0 = a.y0From(posA.coords)
      const bY0 = b.y0From(posB.coords)
      const aY1 = a.y1From(posA.coords)
      const bY1 = b.y1From(posB.coords)
      if (aY0 >= bY1 || bY0 >= aY1) return false

      return true
    } else {
      throw new Error(
        "Collision detection not yet implemented for these shapes.",
      )
    }
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
