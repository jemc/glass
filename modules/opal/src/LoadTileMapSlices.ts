import { Context } from "./Context"
import { registerComponent, World, Box2 } from "@glass/core"

export class LoadTileMapSlices {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly url: string,
    readonly callback: (name: string, box: Box2) => {},
  ) {}
}

export const LoadTileMapSlicesSystem = (world: World) =>
  world.systemFor([Context, LoadTileMapSlices], {
    shouldMatchAll: [LoadTileMapSlices],

    runEach(entity, context, load) {
      const tileMap = context.tileMaps.get(load.url)
      if (!tileMap) return
      world.remove(entity, [LoadTileMapSlices])

      tileMap.forEachSlice(load.callback)
    },
  })
