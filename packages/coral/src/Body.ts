import { registerComponent } from "@glass/core"
import { Context } from "./Context"

export class Body {
  static readonly componentId = registerComponent(this)

  readonly shape: Body.Shape
  readonly tileMapName?: string
  readonly tileMapLayerName?: string

  constructor(
    ...args: [] | [Body.Shape.Box] | [Body.Shape.TileMap, string, string]
  ) {
    this.shape = args[0] ?? Body.Shape.Box
    if (this.shape === Body.Shape.TileMap) {
      this.tileMapName = args[1]
      this.tileMapLayerName = args[2]
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
