import { Entity, System, registerComponent } from "@glass/core"
import { Opal } from "@glass/opal"
import { Bounds } from "./Bounds"
import { Context } from "./Context"
import { Velocity } from "./Velocity"
import { BlockedBy } from "./BlockedBy"

export class Collisions {
  static readonly componentId = registerComponent(this)

  readonly shape: Collisions.Shape
  readonly tileMapName?: string
  readonly tileMapLayerName?: string

  constructor(
    ...args:
      | []
      | [Collisions.Shape.Box]
      | [Collisions.Shape.TileMap, string, string]
  ) {
    this.shape = args[0] ?? Collisions.Shape.Box
    if (this.shape === Collisions.Shape.TileMap) {
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
    if (this.shape !== Collisions.Shape.TileMap)
      throw new TypeError("This is not a TileMap collision shape.")

    return (
      coral.opal.tileMaps
        .get(this.tileMapName!)
        ?.layer(this.tileMapLayerName!)
        ?.isNonZeroInXYRange(x0, x1, y0, y1) ?? false
    )
  }
}

export namespace Collisions {
  export enum Shape {
    Box = 0,
    // TODO: Circle,
    // TODO: Bitmap,
    TileMap,
  }
}
